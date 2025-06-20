import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

<<<<<<< HEAD
const socket = io('http://localhost:3001');

function App() {
  const [connected, setConnected] = useState(false);
=======
// ❗ WICHTIG: Für Deployment auf Heroku 'const socket = io();' verwenden
const socket = io(); // automatisch gleiche Domain wie Backend

function App() {
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const playerName = "Emre"; // TODO: Später durch Eingabe ersetzen
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
<<<<<<< HEAD
      console.log('Mit Backend verbunden!');
=======
      console.log('✅ Mit Backend verbunden');

      // Beim Connect sofort der Lobby beitreten
      socket.emit("join-lobby", playerName);
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
    });

    socket.on('disconnect', () => {
      setConnected(false);
<<<<<<< HEAD
      console.log('Verbindung zum Backend getrennt');
    });

    // Clean up on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
=======
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
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
<<<<<<< HEAD
      <h1>Tristano TCG - Online Prototyp</h1>
      <p>Status: {connected ? 'Verbunden' : 'Nicht verbunden'}</p>
=======
      <h1>🎴 Tristano TCG - Online Prototyp</h1>
      <p>Status: {connected ? '🟢 Verbunden' : '🔴 Nicht verbunden'}</p>

      <h2>🧩 Lobby</h2>
      <p>Angemeldet als: <strong>{playerName}</strong></p>
      <ul>
        {players.map((p, index) => (
          <li key={index}>{p.name}</li>
        ))}
      </ul>
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
    </div>
  );
}

export default App;
