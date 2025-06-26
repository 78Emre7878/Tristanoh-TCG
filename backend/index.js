
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");
const {
  generateDeck,
  shuffle,
  createGameState,
  playCardToField,
  drawCard,
  moveToGraveyard,
  regenerateShield,
  attackMonsterZone
} = require("./gameLogic");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend/build")));

const lobby = new Map();
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Verbunden:", socket.id);
  let playerName = "";

  socket.on("joinLobby", (name) => {
    playerName = name;
    lobby.set(socket.id, name);
    broadcastLobby();
  });

  socket.on("createRoom", () => {
    if (!playerName) return socket.emit("errorMessage", "Name fehlt");
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
      const gameState = createGameState(room.players, roomId);
      room.gameState = gameState;
      io.to(roomId).emit("gameStarted", gameState);
    }
  });

  socket.on("drawCard", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    const card = drawCard(room.gameState, playerName);
    if (card) {
      io.to(roomId).emit("gameStateUpdate", room.gameState);
    }
  });

  socket.on("playCardToField", ({ playerName, handIndex, fieldIndex, roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    const success = playCardToField(room.gameState, playerName, handIndex, fieldIndex);
    if (success) {
      io.to(roomId).emit("gameStateUpdate", room.gameState);
    } else {
      socket.emit("errorMessage", "Karte konnte nicht aufs Feld gelegt werden.");
    }
  });

  socket.on("destroyCard", ({ roomId, fieldIndex }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    const success = moveToGraveyard(room.gameState, playerName, fieldIndex);
    if (success) {
      io.to(roomId).emit("gameStateUpdate", room.gameState);
    }
  });

  socket.on("regenerateShield", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    const success = regenerateShield(room.gameState, playerName);
    if (success) {
      io.to(roomId).emit("gameStateUpdate", room.gameState);
    }
  });

  socket.on("endPhase", ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    const currentPlayer = room.gameState.turn;
    const nextPlayer = room.gameState.players.find((p) => p !== currentPlayer);

    const phases = ["draw", "main", "battle", "end"];
    const currentPhaseIndex = phases.indexOf(room.gameState.phase);

    if (currentPhaseIndex === -1) return;

    if (room.gameState.phase === "end") {
      room.gameState.turn = nextPlayer;
      room.gameState.phase = "draw";
    } else {
      room.gameState.phase = phases[currentPhaseIndex + 1];
    }

    io.to(roomId).emit("gameStateUpdate", room.gameState);
  });

  socket.on("attackShield", ({ attacker, target }) => {
    const room = Array.from(rooms.values()).find((r) => r.players.includes(attacker));
    if (!room || !room.gameState) return;
    const gameState = room.gameState;
    if (gameState.turn !== attacker || gameState.phase !== "battle") return;

    const opponent = room.players.find((p) => p !== attacker);
    const opponentField = gameState.fields[opponent];
    if (!opponentField.shields[target]) return;

    opponentField.shields[target] = false;
    io.to(room.roomId).emit("gameStateUpdate", gameState);
  });

socket.on("attackMonster", ({ attacker, defender, attackerIndex, defenderIndex }) => {
  const room = Array.from(rooms.values()).find((r) => r.players.includes(attacker));
  if (!room || !room.gameState) return;

  const gameState = room.gameState;

  if (gameState.turn !== attacker || gameState.phase !== "battle") return;

  const attackerField = gameState.fields[attacker];
  const defenderField = gameState.fields[defender];

  const attackerCard = attackerField.monsterZones[attackerIndex];
  const defenderCard = defenderField.monsterZones[defenderIndex];

  if (!attackerCard || !defenderCard) return;

  // 🔥 Standard-Regel: beide zerstört
  attackerField.monsterZones[attackerIndex] = null;
  defenderField.monsterZones[defenderIndex] = null;

  attackerField.graveyard.push(attackerCard);
  defenderField.graveyard.push(defenderCard);

  io.to(room.players[0]).emit("gameUpdated", gameState);
  io.to(room.players[1]).emit("gameUpdated", gameState);
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
    const roomList = Array.from(rooms.entries()).map(([id, room]) => ({
      id,
      players: room.players,
    }));
    io.emit("lobbyUpdate", { players: playerNames, rooms: roomList });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
