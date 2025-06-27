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
  attackMonsterZone,
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
  let selectedGame = "";

  socket.on("selectGame", ({ playerName: name, game }) => {
    if (!name || name.length < 3) {
      return socket.emit("errorMessage", "Name ist zu kurz oder fehlt.");
    }

    playerName = name;
    selectedGame = game;

    if (game === "Tristano") {
      lobby.set(socket.id, playerName);
      socket.emit("lobbyJoined", playerName);
      broadcastLobby();
    } else {
      socket.emit("infoMessage", "Dieses Spiel ist noch nicht verfügbar.");
    }
  });

  socket.on("createRoom", () => {
    if (!playerName) return;
    if (rooms.has(playerName)) return;

    const gameState = createGameState([playerName], playerName);
    rooms.set(playerName, {
      players: [playerName],
      ready: new Set(),
      gameState,
      gameStateStarted: false,
    });

    lobby.delete(socket.id);
    socket.join(playerName);
    socket.emit("roomCreated", { id: playerName, players: [playerName] });
    broadcastLobby();
  });

  socket.on("joinRoom", (hostName) => {
    const room = rooms.get(hostName);
    if (!room) return;
    if (room.players.length >= 2) return;

    room.players.push(playerName);
    room.ready.delete(playerName);
    socket.join(hostName);
    lobby.delete(socket.id);
    io.to(hostName).emit("roomJoined", { id: hostName, players: room.players });
    broadcastLobby();
  });

  socket.on("playerReady", (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.ready.add(playerName);
    io.to(roomId).emit("readyStatus", Array.from(room.ready));

    if (room.ready.size === 2 && !room.gameStateStarted) {
      room.gameState = createGameState(room.players, roomId);
      room.gameStateStarted = true;
      io.to(roomId).emit("gameStarted", room.gameState);
    }
  });

  // ✅ KI-Match starten
  socket.on("startAIMatch", () => {
    const roomId = `${playerName}-bot`;
    const botName = "KI_Gegner";

    const gameState = createGameState([playerName, botName], roomId);

    rooms.set(roomId, {
      players: [playerName, botName],
      ready: new Set([playerName, botName]),
      gameState,
      gameStateStarted: true,
      isBotGame: true,
    });

    socket.join(roomId);
    socket.emit("roomCreated", { id: roomId, players: [playerName, botName] });
    io.to(roomId).emit("gameStarted", gameState);

    if (gameState.turn === botName) {
      runBotTurn(roomId);
    }
  });

  socket.on("drawCard", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    drawCard(room.gameState, playerName);
    io.to(roomId).emit("gameStateUpdate", room.gameState);

    if (room.isBotGame && room.gameState.turn === "KI_Gegner") {
      setTimeout(() => runBotTurn(roomId), 500);
    }
  });

  socket.on("playCardToField", ({ playerName, handIndex, fieldIndex, roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const success = playCardToField(room.gameState, playerName, handIndex, fieldIndex);
    if (success) {
      io.to(roomId).emit("gameStateUpdate", room.gameState);
      if (room.isBotGame && room.gameState.turn === "KI_Gegner") {
        setTimeout(() => runBotTurn(roomId), 500);
      }
    }
  });

  socket.on("regenerateShield", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    regenerateShield(room.gameState, playerName);
    io.to(roomId).emit("gameStateUpdate", room.gameState);
  });

  socket.on("endPhase", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const phases = ["draw", "main", "battle", "end"];
    const idx = phases.indexOf(room.gameState.phase);
    if (room.gameState.phase === "end") {
      const current = room.gameState.turn;
      const next = room.players.find((p) => p !== current);
      room.gameState.turn = next;
      room.gameState.phase = "draw";
    } else {
      room.gameState.phase = phases[idx + 1];
    }

    io.to(roomId).emit("gameStateUpdate", room.gameState);

    if (room.isBotGame && room.gameState.turn === "KI_Gegner") {
      setTimeout(() => runBotTurn(roomId), 500);
    }
  });

  socket.on("attackShield", ({ attacker, target, roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    const defender = room.players.find((p) => p !== attacker);
    const shields = room.gameState.fields[defender].shields;

    if (shields[target]) {
      room.gameState.fields[defender].shields[target] = null;
      io.to(roomId).emit("gameStateUpdate", room.gameState);

      if (room.isBotGame && room.gameState.turn === "KI_Gegner") {
        setTimeout(() => runBotTurn(roomId), 500);
      }
    }
  });

  socket.on("attackMonster", ({ attacker, defender, attackerIndex, defenderIndex, roomId }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    const aField = room.gameState.fields[attacker];
    const dField = room.gameState.fields[defender];
    const aCard = aField.monsterZones[attackerIndex];
    const dCard = dField.monsterZones[defenderIndex];

    if (aCard && dCard) {
      aField.monsterZones[attackerIndex] = null;
      dField.monsterZones[defenderIndex] = null;
      aField.graveyard.push(aCard);
      dField.graveyard.push(dCard);
      io.to(roomId).emit("gameStateUpdate", room.gameState);
    }

    if (room.isBotGame && room.gameState.turn === "KI_Gegner") {
      setTimeout(() => runBotTurn(roomId), 500);
    }
  });

  socket.on("chatMessage", ({ roomId, sender, message }) => {
    io.to(roomId).emit("chatMessage", { sender, message });
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

  // ✅ KI-Zug ausführen
  function runBotTurn(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.isBotGame) return;
    const gameState = room.gameState;
    const bot = "KI_Gegner";

    switch (gameState.phase) {
      case "draw":
        drawCard(gameState, bot);
        gameState.phase = "main";
        break;
      case "main":
        const hand = gameState.hands[bot];
        const field = gameState.fields[bot].monsterZones;
        const emptyIndex = field.findIndex((z) => z === null);
        if (hand.length > 0 && emptyIndex !== -1) {
          const cardIdx = 0;
          const card = hand[cardIdx];
          field[emptyIndex] = hand.splice(cardIdx, 1)[0];
        }
        gameState.phase = "battle";
        break;
      case "battle":
        const opponent = room.players.find((p) => p !== bot);
        const opponentField = gameState.fields[opponent].monsterZones;
        const botField = gameState.fields[bot].monsterZones;

        const attackerIdx = botField.findIndex((c) => c);
        const defenderIdx = opponentField.findIndex((c) => c);

        if (attackerIdx !== -1) {
          if (defenderIdx !== -1) {
            attackMonsterZone(gameState, bot, attackerIdx, opponent, defenderIdx);
          } else {
            const shieldIdx = gameState.fields[opponent].shields.findIndex((s) => s);
            if (shieldIdx !== -1) {
              gameState.fields[opponent].shields[shieldIdx] = null;
            }
          }
        }

        gameState.phase = "end";
        break;
      case "end":
        gameState.turn = room.players.find((p) => p !== bot);
        gameState.phase = "draw";
        break;
    }

    io.to(roomId).emit("gameStateUpdate", gameState);

    if (gameState.turn === bot) {
      setTimeout(() => runBotTurn(roomId), 500);
    }
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
