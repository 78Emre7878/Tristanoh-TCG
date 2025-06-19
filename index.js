const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3002", // dein Frontend
    methods: ["GET", "POST"]
  }
});

const PORT = 3002;

let lobby = new Set();  // Spieler in Lobby (socket ids)
let rooms = {};         // Räume mit Spielern: { roomId: [socketId1, socketId2] }

io.on('connection', (socket) => {
  console.log(`Neuer Spieler verbunden: ${socket.id}`);
  lobby.add(socket.id);

  // Lobby-Update an alle senden
  io.emit('lobbyUpdate', Array.from(lobby));

  socket.on('createRoom', () => {
    if (rooms[socket.id]) {
      socket.emit('errorMessage', 'Du hast schon einen Raum.');
      return;
    }
    rooms[socket.id] = [socket.id];
    lobby.delete(socket.id);
    socket.join(socket.id);
    socket.emit('roomCreated', socket.id);
    io.emit('lobbyUpdate', Array.from(lobby));
  });

  socket.on('joinRoom', (roomId) => {
    if (!rooms[roomId]) {
      socket.emit('errorMessage', 'Raum existiert nicht.');
      return;
    }
    if (rooms[roomId].length >= 2) {
      socket.emit('errorMessage', 'Raum ist voll.');
      return;
    }
    rooms[roomId].push(socket.id);
    lobby.delete(socket.id);
    socket.join(roomId);
    io.to(roomId).emit('roomJoined', rooms[roomId]);
    io.emit('lobbyUpdate', Array.from(lobby));
  });

  socket.on('leaveRoom', (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('roomJoined', rooms[roomId]);
      }
      lobby.add(socket.id);
      socket.leave(roomId);
      io.emit('lobbyUpdate', Array.from(lobby));
    }
  });

  socket.on('disconnect', () => {
    console.log(`Spieler getrennt: ${socket.id}`);
    lobby.delete(socket.id);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('roomJoined', rooms[roomId]);
      }
    }
    io.emit('lobbyUpdate', Array.from(lobby));
  });
});

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});