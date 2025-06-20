const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

// === STATIC FRONTEND ===
app.use(express.static(path.join(__dirname, "build")));

// ========== SPIELLOGIK ==========
const lobby = new Map(); // socket.id => name
const rooms = new Map(); // roomId (host name) => [player names]

io.on("connection", (socket) => {
  console.log("🟢 Client verbunden:", socket.id);
  let playerName = "";

  socket.on("joinLobby", (name) => {
    playerName = name;
    lobby.set(socket.id, name);
    broadcastLobby();
  });

  socket.on("createRoom", () => {
    if (!playerName) return socket.emit("errorMessage", "Name fehlt.");
    if (rooms.has(playerName)) {
      return socket.emit("errorMessage", "Du hast bereits einen Raum.");
    }
    rooms.set(playerName, [playerName]);
    lobby.delete(socket.id);
    socket.join(playerName);
    socket.emit("roomCreated", { id: playerName, players: [playerName] });
    broadcastLobby();
  });

  socket.on("joinRoom", (hostName) => {
    const room = rooms.get(hostName);
    if (!room) return socket.emit("errorMessage", "Raum existiert nicht.");
    if (room.length >= 2) return socket.emit("errorMessage", "Raum ist voll.");
    if (room.includes(playerName)) return;

    room.push(playerName);
    socket.join(hostName);
    lobby.delete(socket.id);
    io.to(hostName).emit("roomJoined", { id: hostName, players: room });
    broadcastLobby();
  });

  socket.on("leaveRoom", () => {
    for (const [roomId, players] of rooms.entries()) {
      if (players.includes(playerName)) {
        const updated = players.filter((p) => p !== playerName);
        if (updated.length === 0) {
          rooms.delete(roomId);
        } else {
          rooms.set(roomId, updated);
          io.to(roomId).emit("roomJoined", { id: roomId, players: updated });
        }
        socket.leave(roomId);
        break;
      }
    }
    lobby.set(socket.id, playerName);
    socket.emit("roomLeft");
    broadcastLobby();
  });

  socket.on("disconnect", () => {
    console.log(`🔴 ${playerName || socket.id} hat die Verbindung getrennt`);
    lobby.delete(socket.id);

    for (const [roomId, players] of rooms.entries()) {
      if (players.includes(playerName)) {
        const updated = players.filter((p) => p !== playerName);
        if (updated.length === 0) {
          rooms.delete(roomId);
        } else {
          rooms.set(roomId, updated);
          io.to(roomId).emit("roomJoined", { id: roomId, players: updated });
        }
        break;
      }
    }

    broadcastLobby();
  });

  function broadcastLobby() {
    const playerNames = Array.from(lobby.values());
    io.emit("lobbyUpdate", playerNames);
  }
});

// === REACT AUSLIEFERN ===
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
