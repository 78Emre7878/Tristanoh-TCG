import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io();

function App() {
  const [name, setName] = useState('');
  const [inputName, setInputName] = useState('');
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    socket.on('lobbyUpdate', (players) => setLobbyPlayers(players));
    socket.on('roomCreated', ({ id, players }) => {
      setRoomId(id);
      setRoomPlayers(players);
      setError('');
    });
    socket.on('roomJoined', ({ id, players }) => {
      setRoomId(id);
      setRoomPlayers(players);
      setError('');
    });
    socket.on('roomLeft', () => {
      setRoomId(null);
      setRoomPlayers([]);
      setReady(false);
      setGameStarted(false);
    });
    socket.on('errorMessage', (msg) => setError(msg));
    socket.on('gameStarted', () => setGameStarted(true));

    return () => {
      socket.off('lobbyUpdate');
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('roomLeft');
      socket.off('errorMessage');
      socket.off('gameStarted');
    };
  }, []);

  const joinLobby = () => {
    if (inputName.trim()) {
      const trimmed = inputName.trim();
      setName(trimmed);
      socket.emit('joinLobby', trimmed);
    }
  };

  const createRoom = () => socket.emit('createRoom');
  const joinRoom = (id) => socket.emit('joinRoom', id);
  const leaveRoom = () => socket.emit('leaveRoom');
  const markReady = () => {
    socket.emit('playerReady', roomId);
    setReady(true);
  };

  if (!name) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Tristano TCG Online</h1>
        <p>Gib deinen Namen ein:</p>
        <input value={inputName} onChange={e => setInputName(e.target.value)} />
        <button onClick={joinLobby}>Zur Lobby</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Tristano TCG Online</h1>
      <p>Status: {roomId ? `Im Raum: ${roomId}` : 'In der Lobby'}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!roomId ? (
        <>
          <button onClick={createRoom}>Neuen Raum erstellen</button>
          <h2>Lobby (Spieler ohne Raum):</h2>
          <ul>
            {lobbyPlayers.map(p => (
              <li key={p}>
                {p}{' '}
                {p !== name && <button onClick={() => joinRoom(p)}>Raum betreten</button>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h2>Spielraum: {roomId}</h2>
          <p>Spieler im Raum:</p>
          <ul>
            {roomPlayers.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {!gameStarted ? (
            <>
              <p>Bereit zum Start?</p>
              {!ready ? (
                <button onClick={markReady}>Ich bin bereit</button>
              ) : (
                <p>Warte auf anderen Spieler...</p>
              )}
              <button onClick={leaveRoom}>Raum verlassen</button>
            </>
          ) : (
            <p>🃏 Das Spiel startet!</p>
          )}
        </>
      )}
    </div>
  );
}

export default App;
