// src/SocketContext.js
import React, { createContext, useContext } from "react";
import { io } from "socket.io-client";

// URL vom Backend aus .env-Datei holen oder fallback auf localhost
const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

// ⬅️ DEBUG: Zeige zur Laufzeit die URL im Browser (hilft bei Deployment-Problemen)
console.log("Socket verbindet mit:", backendUrl);

// Verbindung zum Backend herstellen
const socket = io(backendUrl, {
  transports: ["websocket"],
});

// React Context für Socket
export const SocketContext = createContext();

// Provider-Komponente
export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom Hook zur Nutzung des Sockets
export const useSocket = () => useContext(SocketContext);
