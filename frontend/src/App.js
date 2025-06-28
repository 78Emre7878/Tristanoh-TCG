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

    socket.on("lobbyUpdate", ({ rooms }) => {
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

    socket.on("gameStarted", (state) => {
      setGameState(state);
    });

    socket.on("gameStateUpdate", (updatedState) => {
      setGameState(updatedState);
    });

    return () => {
      socket.off("lobbyUpdate");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("gameStarted");
      socket.off("gameStateUpdate");
    };
  }, [socket]);

  const joinLobby = () => {
    if (!name.trim()) return alert("Bitte gib einen Namen ein");
    socket.emit("joinLobby", { playerName: name });
    setInLobby(true);
  };

  const createRoom = () => {
    socket.emit("createRoom");
  };

  const startAIMatch = () => {
    if (!name.trim()) return alert("Bitte gib einen Namen ein");
    socket.emit("startAIMatch", { playerName: name });
  };

  const joinRoom = (id) => {
    socket.emit("joinRoom", id);
  };

  const toggleReady = () => {
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
      {roomId ? (
        <>
          <p>Im Raum: {roomId}</p>
          <p>Spieler im Raum: {playersInRoom.join(", ")}</p>
          {!ready && <button onClick={toggleReady}>Bereit</button>}
        </>
      ) : (
        <>
          <button onClick={createRoom}>Raum erstellen</button>
          <button onClick={startAIMatch}>KI-Match starten</button>
          <h3>Verfügbare Räume:</h3>
          {rooms.map((room) => (
            <div key={room.id}>
              <strong>{room.id}</strong> – Spieler: {room.players.join(", ")}
              <button onClick={() => joinRoom(room.id)}>Beitreten</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;
