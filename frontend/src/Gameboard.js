// src/Gameboard.js
import React, { useState } from "react";
import { useSocket } from "./SocketContext";
import "./styles.css";

function Gameboard({ playerName, gameState, setGameState }) {
  const socket = useSocket();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const handleDrawCard = () => {
    socket.emit("drawCard");
  };

  const handleEndPhase = () => {
    socket.emit("nextPhase");
  };

  const handlePlayCard = (handIndex, fieldIndex) => {
    socket.emit("playCardToField", { handIndex, fieldIndex });
  };

  const handleRegenerateShield = () => {
    socket.emit("regenerateShield");
  };

  const handleAttack = (attackerIndex, defenderIndex) => {
    socket.emit("attack", { attackerIndex, defenderIndex });
  };

  const sendMessage = () => {
    if (chatInput.trim()) {
      const message = `${playerName}: ${chatInput}`;
      setChatMessages((prev) => [...prev, message]);
      setChatInput("");
    }
  };

  const renderCard = (card, isBack = false) => {
    const src = isBack || !card ? "/Cards-Ordner/img/cards/back-side.png" : card.bild;
    return <img className="card" src={src} alt="card" />;
  };

  const opponent = gameState.players.find((p) => p !== playerName);
  const yourField = gameState.fields[playerName];
  const enemyField = gameState.fields[opponent];
  const yourHand = gameState.hands[playerName];
  const yourDeck = gameState.decks[playerName];

  return (
    <div className="game-container">
      <div className="enemy-section">
        <div className="hand">
          {gameState.hands[opponent].map((_, i) => (
            <img
              key={i}
              className="card"
              src="/Cards-Ordner/img/cards/back-side.png"
              alt="back"
            />
          ))}
        </div>

        <div className="shields">
          {enemyField.shields.map((shield, i) => (
            <img
              key={i}
              className="card"
              src={
                shield
                  ? "/Cards-Ordner/img/cards/back-side.png"
                  : enemyField.graveyard.find((c) => c.wert === "2" || c.wert === "3")?.bild ||
                    "/Cards-Ordner/img/cards/back-side.png"
              }
              alt="shield"
            />
          ))}
        </div>

        <div className="monster-zones">
          {enemyField.monsterZones.map((card, i) => (
            <div key={i}>{renderCard(card)}</div>
          ))}
        </div>
      </div>

      <div className="your-section">
        <div className="hand">
          {yourHand.map((card, i) => (
            <img
              key={i}
              className="card"
              src={card.bild}
              alt={card.wert}
              onClick={() => {
                const emptySlot = yourField.monsterZones.findIndex((z) => z === null);
                if (emptySlot !== -1) handlePlayCard(i, emptySlot);
              }}
            />
          ))}
        </div>

        <div className="shields">
          {yourField.shields.map((shield, i) => (
            <img
              key={i}
              className="card"
              src={
                shield
                  ? "/Cards-Ordner/img/cards/back-side.png"
                  : yourField.graveyard.find((c) => c.wert === "2" || c.wert === "3")?.bild ||
                    "/Cards-Ordner/img/cards/back-side.png"
              }
              alt="shield"
            />
          ))}
        </div>

        <div className="monster-zones">
          {yourField.monsterZones.map((card, i) => (
            <div key={i} onClick={() => handleAttack(i, 0)}>
              {renderCard(card)}
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <p>Phase: {gameState.phase}</p>
        <p>Du bist dran: {gameState.turn === playerName ? "✅" : "❌"}</p>
        <button onClick={handleDrawCard}>Ziehen</button>
        <button onClick={handleRegenerateShield}>Schild regenerieren</button>
        <button onClick={handleEndPhase}>Ende Phase</button>
      </div>

      <div className="side-panel">
        <div className="deck-info">
          <img className="card" src="/Cards-Ordner/img/cards/back-side.png" alt="deck" />
          <span>{yourDeck.length} Karten</span>
        </div>

        <div className="graveyard-info">
          <p>Friedhof:</p>
          {yourField.graveyard.map((card, i) => (
            <img key={i} className="card" src={card.bild} alt="grave" />
          ))}
        </div>

        <div className="chat">
          <div className="chat-box">
            {chatMessages.map((m, i) => (
              <div key={i}>{m}</div>
            ))}
          </div>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Nachricht"
          />
          <button onClick={sendMessage}>Senden</button>
        </div>
      </div>
    </div>
  );
}

export default Gameboard;
