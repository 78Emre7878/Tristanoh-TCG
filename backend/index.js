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
app.use(express.static(path.join(__dirname, "build"))); // Build direkt im backend/build

const lobby = new Map(); // socket.id => name
const rooms = new Map(); // roomId => { players: [], ready: Set(), gameState: {...} }

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

    rooms.set(playerName, {
      players: [playerName],
      ready: new Set(),
      gameState: null,
    });

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

  socket.on("playerReady", (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.ready.add(playerName);
    io.to(roomId).emit("readyStatus", Array.from(room.ready));

    if (room.ready.size === 2 && !room.gameState) {
      const gameState = createGameState(room.players);
      room.gameState = gameState;
      io.to(roomId).emit("gameStarted", gameState);
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

// ========== SPIELZUSTAND ==========
function createGameState(players) {
  const redDeck = generateTristanoDeck("rot");
  const blackDeck = generateTristanoDeck("schwarz");

  return {
    players,
    decks: {
      [players[0]]: shuffle([...redDeck]),
      [players[1]]: shuffle([...blackDeck]),
    },
    hands: {
      [players[0]]: [],
      [players[1]]: [],
    },
    field: [],
    turn: players[0],
    phase: "start",
  };
}

function generateTristanoDeck(farbe) {
  const werte = ["4", "5", "6", "7", "8", "9", "10", "Bube", "Dame", "König", "Ass"];
  let deck = [];

  werte.forEach((wert) => {
    deck.push({ farbe, wert });
    deck.push({ farbe, wert });
  });

  deck.push({ farbe, wert: "Joker" });
  return deck;
}

function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex--);
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// React-Build ausliefern
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
