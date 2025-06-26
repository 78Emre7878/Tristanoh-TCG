import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io();

function App() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [room, setRoom] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [readyPlayers, setReadyPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on("lobbyUpdate", (players) => setLobbyPlayers(players));

    socket.on("roomCreated", ({ id, players }) => {
      setRoom(id);
      setRoomPlayers(players);
    });

    socket.on("roomJoined", ({ id, players }) => {
      setRoom(id);
      setRoomPlayers(players);
    });

    socket.on("readyStatus", (readyList) => {
      setReadyPlayers(readyList);
    });

    socket.on("gameStarted", (gameData) => {
      setGameStarted(true);
      setGameState(gameData);
    });

    socket.on("roomLeft", () => {
      setRoom(null);
      setRoomPlayers([]);
      setReadyPlayers([]);
      setGameStarted(false);
      setGameState(null);
    });

    return () => {
      socket.off("lobbyUpdate");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("readyStatus");
      socket.off("gameStarted");
      socket.off("roomLeft");
    };
  }, []);

  const handleLogin = () => {
    if (!username.trim()) return;
    socket.emit("joinLobby", username);
    setIsLoggedIn(true);
  };

  const createRoom = () => {
    socket.emit("createRoom");
  };

  const joinRoom = (hostName) => {
    socket.emit("joinRoom", hostName);
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
  };

  const readyUp = () => {
    if (room) {
      socket.emit("playerReady", room);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Tristano TCG Online</h1>

      {!isLoggedIn ? (
        <>
          <input
            type="text"
            placeholder="Dein Spielername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleLogin}>Lobby betreten</button>
        </>
      ) : !room ? (
        <>
          <h2>Willkommen, {username}</h2>
          <button onClick={createRoom}>🎲 Raum erstellen</button>
          <h3>Spieler in der Lobby:</h3>
          <ul>
            {lobbyPlayers.map((p, i) => (
              <li key={i}>
                {p}{" "}
                {p !== username && (
                  <button onClick={() => joinRoom(p)}>Beitreten</button>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : !gameStarted ? (
        <>
          <h2>Raum: {room}</h2>
          <p>Spieler im Raum: {roomPlayers.join(", ")}</p>
          <p>Bereit: {readyPlayers.join(", ")}</p>
          <button onClick={readyUp}>✅ Bereit</button>
          <button onClick={leaveRoom}>🚪 Verlassen</button>
        </>
      ) : (
        <>
          <h2>🎮 Spiel gestartet!</h2>
          <pre>{JSON.stringify(gameState, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

export default App;
