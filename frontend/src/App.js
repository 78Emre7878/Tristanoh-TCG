import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io(); // Für Heroku automatisch korrekte URL
const emreName = "Emre"; // ❗ Später durch Eingabe ersetzbar

function App() {
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      socket.emit('joinLobby', emreName);
    });

    socket.on('lobbyUpdate', (players) => {
      setLobbyPlayers(players);
    });

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
    });

    socket.on('errorMessage', (msg) => {
      setError(msg);
    });

    return () => {
      socket.off('connect');
      socket.off('lobbyUpdate');
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('roomLeft');
      socket.off('errorMessage');
    };
  }, []);

  const createRoom = () => {
    socket.emit('createRoom');
  };

  const joinRoom = (hostName) => {
    socket.emit('joinRoom', hostName);
  };

  const leaveRoom = () => {
    socket.emit('leaveRoom');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🎴 Tristano TCG Online Prototyp</h1>
      <p>Status: {roomId ? `🧩 Im Raum: ${roomId}` : '🏠 In der Lobby'}</p>
      {error && <p style={{ color: 'red' }}>Fehler: {error}</p>}

      {!roomId && (
        <>
          <p>Angemeldet als: <strong>{emreName}</strong></p>
          <button onClick={createRoom}>➕ Neuen Raum erstellen</button>
          <h2>⚔️ Verfügbare
