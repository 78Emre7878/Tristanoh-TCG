// src/Gameboard.js
import React, { useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import "./Gameboard.css";

function Gameboard({ playerName, gameState, setGameState }) {
  const socket = useSocket();
  const [phase, setPhase] = useState("draw");
  const [hand, setHand] = useState([]);
  const [field, setField] = useState([null, null, null]);
  const [deckCount, setDeckCount] = useState(0);
  const [graveyard, setGraveyard] = useState([]);
  const [shields, setShields] = useState([true, true, true, true]);
  const [timer, setTimer] = useState(30);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const isMyTurn = gameState?.turn === playerName;
  const roomId = gameState?.roomId || "";
  const opponentName = gameState?.players?.find((p) => p !== playerName);
  const opponentField = gameState?.fields?.[opponentName] || {};
  const opponentHandCount = gameState?.hands?.[opponentName]?.length || 0;

  const myDeckColor = gameState?.decks?.[playerName]?.[0]?.farbe || "rot";
  const opponentDeckColor = gameState?.decks?.[opponentName]?.[0]?.farbe || "schwarz";

  useEffect(() => {
    const playerData = gameState?.fields?.[playerName];
    if (!playerData) return;

    setHand(gameState.hands[playerName] || []);
    setField(playerData.monsterZones || [null, null, null]);
    setGraveyard(playerData.graveyard || []);
    setDeckCount(gameState.decks?.[playerName]?.length || 0);
    setShields(playerData.shields || [true, true, true, true]);
    setPhase(gameState.phase || "draw");
  }, [gameState, playerName]);

  useEffect(() => {
    if (!isMyTurn) return;
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          socket.emit("endPhase", { roomId, playerName });
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, isMyTurn]);

  useEffect(() => {
    socket.on("chatMessage", ({ sender, message }) => {
      setChatMessages((prev) => [...prev, { from: sender, message }]);
    });
    return () => socket.off("chatMessage");
  }, [socket]);

  const drawCard = () => socket.emit("drawCard", { roomId });
  const endPhase = () => socket.emit("endPhase", { roomId, playerName });
  const regenerateShield = () => socket.emit("regenerateShield", { roomId });

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit("chatMessage", { roomId, sender: playerName, message: newMessage });
      setNewMessage("");
    }
  };

  const playCard = (handIndex, fieldIndex) => {
    socket.emit("playCardToField", {
      playerName,
      handIndex,
      fieldIndex,
      roomId,
    });
  };

  const attackShield = (shieldIndex) => {
    if (isMyTurn && phase === "battle") {
      socket.emit("attackShield", {
        attacker: playerName,
        target: shieldIndex,
        roomId,
      });
    }
  };

  const attackMonster = (attackerIndex, defenderIndex) => {
    if (!isMyTurn || phase !== "battle") return;
    socket.emit("attackMonster", {
      attacker: playerName,
      defender: opponentName,
      attackerIndex,
      defenderIndex,
      roomId,
    });
  };

  const renderShields = (shieldArray, isOwn, deckColor) => {
    const predefinedCards = {
      rot: ["2_of_diamonds", "2_of_hearts", "3_of_diamonds", "3_of_hearts"],
      schwarz: ["2_of_clubs", "2_of_spades", "3_of_clubs", "3_of_spades"],
    };

    const deckCards = predefinedCards[deckColor] || [];

    return shieldArray.map((shield, idx) => {
      const imageSrc = shield
        ? "/Cards-Ordner/img/cards/back-side.png"
        : `/Cards-Ordner/img/cards/${deckCards[idx]}.png`;
      return (
        <div className="shield" key={idx}>
          <img
            src={imageSrc}
            alt="Schild"
            className="card"
            onClick={!isOwn && isMyTurn && phase === "battle" ? () => attackShield(idx) : undefined}
          />
        </div>
      );
    });
  };

  return (
    <div className="tristano-board">
      <div className="phase-bar">
        <div>
          <button onClick={drawCard} disabled={!isMyTurn || phase !== "draw"}>Draw</button>
          <button disabled={!isMyTurn || phase !== "main"}>Main</button>
          <button disabled={!isMyTurn || phase !== "battle"}>Battle</button>
          <button onClick={endPhase} disabled={!isMyTurn}>End</button>
        </div>
        <div className="timer">Zeit: {timer}s</div>
      </div>

      <div className="board-container">
        {/* Gegnerseite */}
        <div className="player-area">
          <div className="hand">
            {Array.from({ length: opponentHandCount }).map((_, i) => (
              <img key={i} src="/Cards-Ordner/img/cards/back-side.png" className="card" />
            ))}
          </div>
          <div className="shields">
            {renderShields(opponentField.shields || [true, true, true, true], false, opponentDeckColor)}
          </div>
          <div className="field">
            {opponentField.monsterZones?.map((card, idx) => (
              <div className="monsterzone" key={idx}>
                {card && (
                  <img
                    src={card.bild}
                    alt=""
                    className="card"
                    onClick={() => {
                      const attackerIdx = field.findIndex((c) => c !== null);
                      if (attackerIdx !== -1) attackMonster(attackerIdx, idx);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat & Timer */}
        <div className="chat-area">
          <div className="chat-box">
            <h4>Chat</h4>
            <div className="chat-messages">
              {chatMessages.map((msg, i) => (
                <div key={i}><strong>{msg.from}: </strong>{msg.message}</div>
              ))}
            </div>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Nachricht..."
            />
            <button onClick={sendMessage}>Senden</button>
          </div>
        </div>

        {/* Eigene Seite */}
        <div className="player-area">
          <div className="hand">
            {hand.map((card, idx) => (
              <img
                key={idx}
                src={card.bild}
                alt={`${card.wert} ${card.symbol}`}
                className="card"
                onClick={() => {
                  const emptyIndex = field.findIndex((z) => z === null);
                  if (isMyTurn && phase === "main" && emptyIndex !== -1) {
                    playCard(idx, emptyIndex);
                  }
                }}
              />
            ))}
          </div>
          <div className="shields">
            {renderShields(shields, true, myDeckColor)}
          </div>
          <div className="field">
            {field.map((card, idx) => (
              <div className="monsterzone" key={idx}>
                {card && <img src={card.bild} alt="" className="card" />}
              </div>
            ))}
          </div>
        </div>

        {/* Deck/Friedhof rechts neben Schilde */}
        <div className="side-zone">
          <div className="deck">
            <img src="/Cards-Ordner/img/cards/back-side.png" className="card" />
            <div>{deckCount} Karten</div>
          </div>
          <div className="graveyard">Friedhof: {graveyard.length}</div>
          <button onClick={regenerateShield}>Ass abwerfen für Schild</button>
        </div>
      </div>
    </div>
  );
}

export default Gameboard;
