// backend/index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const {
  createGameState,
  drawCard,
  playCardToField,
  regenerateShield,
  attackMonsterZone,
  nextPhase,
  performAIActions,
} = require("./gameLogic");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3001;

const rooms = {}; // { roomId: { players: [], ready: [], gameState: {}, isAI: false } }

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

io.on("connection", (socket) => {
  console.log("Ein Spieler hat sich verbunden: " + socket.id);

  socket.on("joinLobby", ({ playerName }) => {
    if (!playerName || typeof playerName !== "string") return;
    socket.data.name = playerName;
    io.emit("lobbyUpdate", getLobbyData());
  });

  socket.on("createRoom", () => {
    const playerName = socket.data.name;
    if (!playerName) return;
    const roomId = generateRoomId();
    rooms[roomId] = { players: [playerName], ready: [], isAI: false };
    socket.join(roomId);
    io.to(socket.id).emit("roomCreated", {
      id: roomId,
      players: rooms[roomId].players,
    });
    io.emit("lobbyUpdate", getLobbyData());
  });

  socket.on("joinRoom", (roomId) => {
    const playerName = socket.data.name;
    if (!playerName || !rooms[roomId] || rooms[roomId].players.length >= 2) return;
    rooms[roomId].players.push(playerName);
    socket.join(roomId);
    io.to(roomId).emit("roomJoined", {
      id: roomId,
      players: rooms[roomId].players,
    });
    io.emit("lobbyUpdate", getLobbyData());
  });

  socket.on("playerReady", (roomId) => {
    const room = rooms[roomId];
    if (!room || !socket.data.name) return;
    if (!room.ready.includes(socket.data.name)) {
      room.ready.push(socket.data.name);
    }
    if (room.ready.length === 2 && !room.isAI) {
      room.gameState = createGameState(room.players, roomId);
      io.to(roomId).emit("gameStarted", room.gameState);
    }
  });

  socket.on("startAIMatch", ({ playerName }) => {
    if (!playerName) return;
    const roomId = generateRoomId();
    const aiName = "KI-Gegner";
    rooms[roomId] = {
      players: [playerName, aiName],
      ready: [playerName, aiName],
      isAI: true,
    };
    socket.join(roomId);
    const state = createGameState([playerName, aiName], roomId);
    rooms[roomId].gameState = state;
    io.to(roomId).emit("gameStarted", state);
  });

  socket.on("drawCard", () => {
    const roomId = getRoomIdForPlayer(socket);
    const game = rooms[roomId];
    if (!game) return;
    drawCard(game.gameState, socket.data.name);
    io.to(roomId).emit("gameStateUpdate", game.gameState);
  });

  socket.on("playCardToField", ({ handIndex, fieldIndex }) => {
    const roomId = getRoomIdForPlayer(socket);
    const game = rooms[roomId];
    if (!game) return;
    playCardToField(game.gameState, socket.data.name, handIndex, fieldIndex);
    io.to(roomId).emit("gameStateUpdate", game.gameState);
  });

  socket.on("regenerateShield", () => {
    const roomId = getRoomIdForPlayer(socket);
    const game = rooms[roomId];
    if (!game) return;
    regenerateShield(game.gameState, socket.data.name);
    io.to(roomId).emit("gameStateUpdate", game.gameState);
  });

  socket.on("attack", ({ attackerIndex, defenderIndex }) => {
    const roomId = getRoomIdForPlayer(socket);
    const game = rooms[roomId];
    if (!game) return;
    const enemy = game.gameState.players.find((p) => p !== socket.data.name);
    attackMonsterZone(game.gameState, socket.data.name, attackerIndex, enemy, defenderIndex);
    io.to(roomId).emit("gameStateUpdate", game.gameState);
  });

  socket.on("nextPhase", () => {
    const roomId = getRoomIdForPlayer(socket);
    const game = rooms[roomId];
    if (!game) return;
    const { gameState, isAI } = game;
    const currentPlayer = gameState.turn;
    nextPhase(gameState);
    io.to(roomId).emit("gameStateUpdate", gameState);
    if (isAI && gameState.turn === "KI-Gegner") {
      setTimeout(() => {
        performAIActions(gameState, "KI-Gegner");
        io.to(roomId).emit("gameStateUpdate", gameState);
      }, 1500);
    }
  });
});

function getLobbyData() {
  const allRooms = Object.entries(rooms).map(([id, data]) => ({
    id,
    players: data.players,
  }));
  return { rooms: allRooms };
}

function generateRoomId() {
  return Math.random().toString(36).substr(2, 6);
}

function getRoomIdForPlayer(socket) {
  const name = socket.data.name;
  return Object.entries(rooms).find(([id, room]) =>
    room.players.includes(name)
  )?.[0];
}

server.listen(PORT, () => {
  console.log("✅ Server läuft auf Port " + PORT);
});
