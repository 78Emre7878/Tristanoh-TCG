// src/App.js
import React, { useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import Gameboard from "./Gameboard";

function App() {
  const socket = useSocket();
  const [name, setName] = useState("");
  const [inLobby, setInLobby] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [playersInRoom, setPlayersInRoom] = useState([]);
  const [ready, setReady] = useState(false);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("✅ Socket verbunden mit ID:", socket.id);
    });

    socket.on("lobbyUpdate", ({ players, rooms }) => {
      setRooms(rooms);
    });

    socket.on("roomCreated", ({ id, players }) => {
      console.log("🎉 Raum erstellt:", id);
      setRoomId(id);
      setPlayersInRoom(players);
    });

    socket.on("roomJoined", ({ id, players }) => {
      console.log("🔗 Raum beigetreten:", id);
      setRoomId(id);
      setPlayersInRoom(players);
    });

    socket.on("readyStatus", (readyList) => {
      console.log("✅ Ready-Status:", readyList);
    });

    socket.on("gameStarted", (state) => {
      console.log("🚀 Spiel gestartet!");
      state.roomId = roomId;
      setGameState(state);
    });

    socket.on("gameStateUpdate", (updatedState) => {
      updatedState.roomId = roomId;
      setGameState(updatedState);
    });

    return () => {
      socket.off("connect");
      socket.off("lobbyUpdate");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("readyStatus");
      socket.off("gameStarted");
      socket.off("gameStateUpdate");
    };
  }, [socket, roomId]);

  const joinLobby = () => {
    if (!name.trim()) {
      alert("Bitte Namen eingeben.");
      return;
    }
    console.log("🔓 Betrete Lobby mit Name:", name);
    socket.emit("joinLobby", { playerName: name });
    setInLobby(true);
  };

  const createRoom = () => {
    console.log("🎯 Raum erstellen Button gedrückt");
    socket.emit("createRoom");
  };

  const startAIMatch = () => {
    console.log("🤖 KI-Match starten Button gedrückt");
    socket.emit("startAIMatch", { playerName: name });
  };

  const joinRoom = (id) => {
    console.log("🔗 Beitreten zu Raum:", id);
    socket.emit("joinRoom", id);
  };

  const toggleReady = () => {
    console.log("✅ Spieler bereit in Raum:", roomId);
    socket.emit("playerReady", roomId);
    setReady(true);
  };

  if (!inLobby) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Tristano TCG</h1>
        <input
          placeholder="Dein Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={joinLobby}>Zur Lobby</button>
      </div>
    );
  }

  if (gameState) {
    return (
      <Gameboard
        playerName={name}
        gameState={gameState}
        setGameState={setGameState}
      />
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Lobby</h1>
      <h2>Willkommen, {name}</h2>
      {!roomId && (
        <>
          <button onClick={createRoom}>🎯 Raum erstellen</button>
          <button onClick={startAIMatch}>🤖 KI-Match starten</button>
          <h3>Verfügbare Räume:</h3>
          {rooms.map((room) => (
            <div key={room.id}>
              <strong>{room.id}</strong> – Spieler:{" "}
              {Array.isArray(room.players)
                ? room.players
                    .map((p, i) => {
                      if (typeof p === "object" && p !== null && "playerName" in p) {
                        return p.playerName;
                      } else if (typeof p === "string") {
                        return p;
                      } else {
                        return `?${i}`;
                      }
                    })
                    .join(", ")
                : "Keine Spieler"}
              <button onClick={() => joinRoom(room.id)}>Beitreten</button>
            </div>
          ))}
        </>
      )}
      {roomId && (
        <>
          <p>Im Raum: {roomId}</p>
          <p>
            Spieler im Raum:{" "}
            {Array.isArray(playersInRoom)
              ? playersInRoom
                  .map((p, i) => {
                    if (typeof p === "object" && p !== null && "playerName" in p) {
                      return p.playerName;
                    } else if (typeof p === "string") {
                      return p;
                    } else {
                      return `Unbekannt${i}`;
                    }
                  })
                  .join(", ")
              : "Unbekannt"}
          </p>
          {!ready && <button onClick={toggleReady}>Bereit</button>}
        </>
      )}
    </div>
  );
}

export default App;
