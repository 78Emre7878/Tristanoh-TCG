import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// ❗ WICHTIG: Für Deployment auf Heroku 'const socket = io();' verwenden
const socket = io(); // automatisch gleiche Domain wie Backend

function App() {
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const playerName = "Emre"; // TODO: Später durch Eingabe ersetzen

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      console.log('✅ Mit Backend verbunden');

      // Beim Connect sofort der Lobby beitreten
      socket.emit("join-lobby", playerName);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Verbindung zum Backend getrennt');
    });

    socket.on("lobby-update", (playerList) => {
      setPlayers(playerList);
      console.log("🧑‍🤝‍🧑 Lobby-Update:", playerList);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('lobby-update');
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🎴 Tristano TCG - Online Prototyp</h1>
      <p>Status: {connected ? '🟢 Verbunden' : '🔴 Nicht verbunden'}</p>

      <h2>🧩 Lobby</h2>
      <p>Angemeldet als: <strong>{playerName}</strong></p>
      <ul>
        {players.map((p, index) => (
          <li key={index}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
