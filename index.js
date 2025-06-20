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

// Middleware
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "frontend", "build")));

// Socket.io logic
io.on("connection", (socket) => {
  console.log("🟢 Neuer Client verbunden:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client getrennt:", socket.id);
  });

  socket.on("chat-message", (msg) => {
    console.log("📨 Chat:", msg);
    io.emit("chat-message", msg);
  });
});

// Catch-all route – must be LAST
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});
