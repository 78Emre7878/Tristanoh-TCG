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

// 📁 Pfad zum React-Build
const buildPath = path.join(__dirname, "..", "frontend", "build");
app.use(express.static(buildPath));

// ========== SPIELLOGIK ==========
const lobby = new Map(); // socket.id => name
const rooms = new Map(); // roomId => { players: [name1, name2], ready: Set<name> }

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
    rooms.set(playerName, { players: [playerName], ready: new Set() });
    lobby.delete(socket.id);
    socket.join(playerName);
    socket.emit("roomCreated", { id: playerName, players: [playerName] });
    broadcastLobby();
  });

  socket.on("joinRoom", (hostName) => {
    const room = rooms.get(hostName);
    if (!room) return socket.emit("errorMessage", "Raum existiert nicht.");
    if (room.players.length >= 2) return socket.emit("errorMessage", "Raum ist voll.");
    if (room.players.includes(playerName)) return;

    room.players.push(playerName);
    room.ready.delete(playerName);
    socket.join(hostName);
    lobby.delete(socket.id);
    io.to(hostName).emit("roomJoined", { id: hostName, players: room.players });
    broadcastLobby();
  });

  socket.on("leaveRoom", () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.includes(playerName)) {
        room.players = room.players.filter((p) => p !== playerName);
        room.ready.delete(playerName);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          rooms.set(roomId, room);
          io.to(roomId).emit("roomJoined", { id: roomId, players: room.players });
        }
        socket.leave(roomId);
        break;
      }
    }
    lobby.set(socket.id, playerName);
    socket.emit("roomLeft");
    broadcastLobby();
  });

  socket.on("readyUp", () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.includes(playerName)) {
        room.ready.add(playerName);
        io.to(roomId).emit("readyStatus", Array.from(room.ready));

        if (room.ready.size === 2) {
          io.to(roomId).emit("gameStart", {
            players: room.players,
            message: "Spiel startet!",
          });
        }
        break;
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 ${playerName || socket.id} hat die Verbindung getrennt`);
    lobby.delete(socket.id);

    for (const [roomId, room] of rooms.entries()) {
      if (room.players.includes(playerName)) {
        room.players = room.players.filter((p) => p !== playerName);
        room.ready.delete(playerName);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          rooms.set(roomId, room);
          io.to(roomId).emit("roomJoined", { id: roomId, players: room.players });
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

// ✨ React-App ausliefern (Fallback bei GET)
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
