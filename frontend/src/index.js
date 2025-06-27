// frontend/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SocketProvider } from "./SocketContext"; // ← Importiere den Provider
import "./index.css"; // optionales Styling

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <SocketProvider> {/* ← Provider um App legen */}
      <App />
    </SocketProvider>
  </React.StrictMode>
);
