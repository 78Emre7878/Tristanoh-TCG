import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3002');

function App() {
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('lobbyUpdate', (players) => {
      setLobbyPlayers(players);
    });

    socket.on('roomCreated', (id) => {
      setRoomId(id);
      setRoomPlayers([socket.id]);
      setError('');
    });

    socket.on('roomJoined', (players) => {
      setRoomPlayers(players);
      setError('');
    });

    socket.on('errorMessage', (msg) => {
      setError(msg);
    });

    return () => {
      socket.off('lobbyUpdate');
      socket.off('roomCreated');
      socket.off('roomJoined');
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
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Tristano TCG Online Prototyp</h1>
      <p>Status: {roomId ? `Im Raum: ${roomId}` : 'In der Lobby'}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!roomId && (
        <>
          <button onClick={createRoom}>Neuen Raum erstellen</button>
          <h2>Lobby (Spieler ohne Raum):</h2>
          <ul>
            {lobbyPlayers.map(p => (
              <li key={p}>
                {p} {' '}
                <button onClick={() => joinRoom(p)}>Raum betreten</button>
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
          <button onClick={leaveRoom}>Raum verlassen</button>
          {roomPlayers.length === 2 && <p>Spiel kann gestartet werden!</p>}
        </>
      )}
    </div>
  );
}

export default App;
