// src/SocketContext.js
import React, { createContext, useContext } from "react";
import { io } from "socket.io-client";

// Verbindung zum Backend herstellen
export const socket = io("http://localhost:3001");

// Context erstellen
export const SocketContext = createContext();

// Context-Provider-Komponente
export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom Hook für einfachen Zugriff
export const useSocket = () => useContext(SocketContext);
