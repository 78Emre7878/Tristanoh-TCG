import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      console.log('Mit Backend verbunden!');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Verbindung zum Backend getrennt');
    });

    // Clean up on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Tristano TCG - Online Prototyp</h1>
      <p>Status: {connected ? 'Verbunden' : 'Nicht verbunden'}</p>
    </div>
  );
}

export default App;
