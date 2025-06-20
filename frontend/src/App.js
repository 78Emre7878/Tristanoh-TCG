import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io();

function App() {
  const [name, setName] = useState("");
  const [inLobby, setInLobby] = useState(false);
  const [players, setPlayers] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [readyPlayers, setReadyPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on("lobbyUpdate", (lobbyPlayers) => {
      setPlayers(lobbyPlayers);
    });

    socket.on("roomCreated", ({ id, players }) => {
      setRoomId(id);
      setPlayers(players);
    });

    socket.on("roomJoined", ({ id, players }) => {
      setRoomId(id);
      setPlayers(players);
    });

    socket.on("roomLeft", () => {
      setRoomId(null);
      setGameState(null);
      setReadyPlayers([]);
      setInLobby(true);
    });

    socket.on("readyStatus", (readyList) => {
      setReadyPlayers(readyList);
    });

    socket.on("gameStarted", (state) => {
      setGameState(state);
    });

    return () => {
      socket.off();
    };
  }, []);

  const joinLobby = () => {
    if (!name) return;
    socket.emit("joinLobby", name);
    setInLobby(true);
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

  const toggleReady = () => {
    socket.emit("playerReady", roomId);
  };

  return (
    <div style={{ padding: 20 }}>
      {!inLobby ? (
        <div>
          <h1>Tristano TCG</h1>
          <input
            placeholder="Dein Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={joinLobby}>Lobby betreten</button>
        </div>
      ) : roomId ? (
        <div>
          <h2>Raum: {roomId}</h2>
          <p>Spieler im Raum: {players.join(", ")}</p>
          <p>Bereit: {readyPlayers.join(", ")}</p>
          {gameState ? (
            <div>
              <h3>Spiel gestartet</h3>
              <p>Du bist: {name}</p>
              <p>Zug: {gameState.turn}</p>
              <p>Phase: {gameState.phase}</p>
              <h4>Handkarten:</h4>
              <ul>
                {(gameState.hands[name] || []).map((card, i) => (
                  <li key={i}>{card.wert} ({card.farbe})</li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <button onClick={toggleReady}>Bereit</button>
              <button onClick={leaveRoom}>Raum verlassen</button>
            </>
          )}
        </div>
      ) : (
        <div>
          <h2>Lobby</h2>
          <p>Spieler online:</p>
          <ul>
            {players.map((p) => (
              <li key={p}>
                {p}
                {p !== name && <button onClick={() => joinRoom(p)}>Beitreten</button>}
              </li>
            ))}
          </ul>
          <button onClick={createRoom}>Neuen Raum erstellen</button>
        </div>
      )}
    </div>
  );
}

export default App;
