import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      console.log('Verbunden mit Socket-ID:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Verbindung getrennt');
    });

    socket.on('nachricht', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Cleanup beim Verlassen der Komponente
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('nachricht');
    };
  }, []);

  const sendeNachricht = () => {
    if (input.trim() !== '') {
      socket.emit('nachricht', input);
      setInput('');
    }
  };

  return (
    <div>
      <h1>Tristano TCG Online Prototyp</h1>
      <p>Status: {connected ? 'Verbunden' : 'Nicht verbunden'}</p>

      <div>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Nachricht eingeben"
        />
        <button onClick={sendeNachricht}>Senden</button>
      </div>

      <div>
        <h2>Chat</h2>
        <ul>
          {messages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
