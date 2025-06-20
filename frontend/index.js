import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    socket.on('updatePlayers', (data) => {
      setPlayers(data);
    });

    return () => {
      socket.off('updatePlayers');
    };
  }, []);

  const handleLogin = () => {
    if (username.trim() === '') return;
    socket.emit('joinLobby', username);
    setIsLoggedIn(true);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Tristano TCG Online-Prototyp</h1>

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
      ) : (
        <>
          <h2>Lobby</h2>
          <p>Willkommen, {username}!</p>
          <h3>Spieler in der Lobby:</h3>
          <ul>
            {players.map((player, idx) => (
              <li key={idx}>{player}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
