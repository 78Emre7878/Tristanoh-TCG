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

    socket.on("lobbyUpdate", ({ players, rooms }) => {
      setRooms(rooms);
    });

    socket.on("roomCreated", ({ id, players }) => {
      setRoomId(id);
      setPlayersInRoom(players);
    });

    socket.on("roomJoined", ({ id, players }) => {
      setRoomId(id);
      setPlayersInRoom(players);
    });

    socket.on("readyStatus", (readyList) => {
      // Optional: anzeigen, wer bereit ist
    });

    socket.on("gameStarted", (state) => {
      state.roomId = roomId;
      setGameState(state);
    });

    socket.on("gameStateUpdate", (updatedState) => {
      updatedState.roomId = roomId;
      setGameState(updatedState);
    });

    return () => {
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
      alert("Bitte gib einen Namen ein.");
      return;
    }

    socket.emit("selectGame", { playerName: name, game: "Tristano" });
    setInLobby(true);
  };

  const createRoom = () => {
    socket.emit("createRoom");
  };

  const joinRoom = (id) => {
    socket.emit("joinRoom", id);
  };

  const toggleReady = () => {
    socket.emit("playerReady", roomId);
    setReady(true);
  };

  const startAIMatch = () => {
    socket.emit("startAIMatch");
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

      {roomId ? (
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
      ) : (
        <>
          <button onClick={createRoom}>Raum erstellen</button>
          <button onClick={startAIMatch}>Gegen KI spielen</button>
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
    </div>
  );
}

export default App;
