const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Tristano Backend läuft!');
});

io.on('connection', (socket) => {
  console.log('Ein Spieler hat sich verbunden:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Spieler getrennt:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});

