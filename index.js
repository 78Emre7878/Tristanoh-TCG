const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Mittelware
app.use(cors());

// Statischer Build (React-Frontend)
app.use(express.static(path.join(__dirname, "frontend", "build")));

// Root Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
});

// Socket.io Setup
io.on("connection", (socket) => {
  console.log("🟢 Neuer Client verbunden:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client getrennt:", socket.id);
  });

  // Beispiel-Event
  socket.on("chat-message", (msg) => {
    console.log("📨 Chat:", msg);
    io.emit("chat-message", msg);
  });
});

// Port
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
