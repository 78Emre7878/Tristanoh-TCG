import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

<<<<<<< HEAD
const socket = io('http://localhost:3002');

function App() {
=======
const socket = io();

function App() {
  const [name, setName] = useState('');
  const [inputName, setInputName] = useState('');
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [error, setError] = useState('');
<<<<<<< HEAD
=======
  const [ready, setReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc

  useEffect(() => {
    socket.on('lobbyUpdate', (players) => {
      setLobbyPlayers(players);
    });

<<<<<<< HEAD
    socket.on('roomCreated', (id) => {
      setRoomId(id);
      setRoomPlayers([socket.id]);
      setError('');
    });

    socket.on('roomJoined', (players) => {
=======
    socket.on('roomCreated', ({ id, players }) => {
      setRoomId(id);
      setRoomPlayers(players);
      setError('');
    });

    socket.on('roomJoined', ({ id, players }) => {
      setRoomId(id);
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
      setRoomPlayers(players);
      setError('');
    });

<<<<<<< HEAD
    socket.on('errorMessage', (msg) => {
      setError(msg);
=======
    socket.on('roomLeft', () => {
      setRoomId(null);
      setRoomPlayers([]);
      setReady(false);
      setGameStarted(false);
    });

    socket.on('errorMessage', (msg) => {
      setError(msg);
    });

    socket.on('gameStarted', () => {
      setGameStarted(true);
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
    });

    return () => {
      socket.off('lobbyUpdate');
      socket.off('roomCreated');
      socket.off('roomJoined');
<<<<<<< HEAD
      socket.off('errorMessage');
    };
  }, []);

  const createRoom = () => {
    socket.emit('createRoom');
  };

  const joinRoom = (id) => {
    socket.emit('joinRoom', id);
  };

  const leaveRoom = () => {
    if (roomId) {
      socket.emit('leaveRoom', roomId);
      setRoomId(null);
      setRoomPlayers([]);
=======
      socket.off('roomLeft');
      socket.off('errorMessage');
      socket.off('gameStarted');
    };
  }, []);

  const joinLobby = () => {
    if (inputName.trim()) {
      setName(inputName.trim());
      socket.emit('joinLobby', inputName.trim());
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
    }
  };

  const createRoom = () => {
    socket.emit('createRoom');
  };

  const joinRoom = (id) => {
    socket.emit('joinRoom', id);
  };

  const leaveRoom = () => {
    if (roomId) {
      socket.emit('leaveRoom');
    }
  };

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
<<<<<<< HEAD
      <h1>Tristano TCG Online Prototyp</h1>
=======
      <h1>Tristano TCG Online</h1>
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
      <p>Status: {roomId ? `Im Raum: ${roomId}` : 'In der Lobby'}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!roomId && (
        <>
          <button onClick={createRoom}>Neuen Raum erstellen</button>
          <h2>Lobby (Spieler ohne Raum):</h2>
          <ul>
            {lobbyPlayers.map(p => (
              <li key={p}>
<<<<<<< HEAD
                {p} {' '}
                <button onClick={() => joinRoom(p)}>Raum betreten</button>
=======
                {p}{' '}
                {p !== name && (
                  <button onClick={() => joinRoom(p)}>Raum betreten</button>
                )}
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
              </li>
            ))}
          </ul>
        </>
      )}

      {roomId && (
        <>
          <h2>Spielraum: {roomId}</h2>
          <p>Spieler im Raum:</p>
          <ul>
            {roomPlayers.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
<<<<<<< HEAD
          <button onClick={leaveRoom}>Raum verlassen</button>
          {roomPlayers.length === 2 && <p>Spiel kann gestartet werden!</p>}
=======

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
>>>>>>> 4ee0dfc0b281cadc22f7f6ce31cccebaf11b65bc
        </>
      )}
    </div>
  );
}

export default App;
