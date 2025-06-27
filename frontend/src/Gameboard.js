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
  const [shields, setShields] = useState([true, true, true, true, true]);

  const isMyTurn = gameState?.turn === playerName;
  const roomId = gameState?.roomId || "";

  const opponentName = gameState?.players?.find((p) => p !== playerName);
  const opponentField = gameState?.fields?.[opponentName] || {};
  const opponentHandCount = gameState?.hands?.[opponentName]?.length || 0;

  useEffect(() => {
    if (!gameState || !gameState.fields || !gameState.hands) return;

    const playerData = gameState.fields[playerName];
    if (!playerData) return;

    setHand(gameState.hands[playerName] || []);
    setField(playerData.monsterZones || [null, null, null]);
    setGraveyard(playerData.graveyard || []);
    setDeckCount(gameState.decks?.[playerName]?.length || 0);
    setShields(playerData.shields || [true, true, true, true, true]);
    setPhase(gameState.phase || "draw");
  }, [gameState, playerName]);

  const drawCard = () => socket.emit("drawCard", { roomId });
  const endPhase = () => socket.emit("endPhase", { roomId, playerName });
  const regenerateShield = () => socket.emit("regenerateShield", { roomId });

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

  return (
    <div className="tristano-board">
      <div className="phase-bar">
        <button onClick={drawCard} disabled={!isMyTurn || phase !== "draw"}>
          Draw
        </button>
        <button disabled={!isMyTurn || phase !== "main"}>Main</button>
        <button disabled={!isMyTurn || phase !== "battle"}>Battle</button>
        <button onClick={endPhase} disabled={!isMyTurn}>
          End
        </button>
      </div>

      {/* Gegner */}
      <div className="player-opponent">
        <div className="deck">Deck</div>
        <div className="graveyard">Friedhof</div>

        <div className="shields">
          {opponentField.shields?.map((shield, idx) => (
            <div className="shield" key={idx}>
              {shield ? (
                <img
                  src="/Cards-Ordner/img/cards/card_back.png"
                  alt={`Schild ${idx + 1}`}
                  className="card"
                  onClick={() => attackShield(idx)}
                />
              ) : (
                <div className="empty">Zerstört</div>
              )}
            </div>
          ))}
        </div>

        <div className="field">
          {opponentField.monsterZones?.map((card, idx) => (
            <div className="monsterzone" key={idx}>
              {card ? (
                <img
                  src={card.bild}
                  alt=""
                  className="card"
                  onClick={() => {
                    const attackerIdx = field.findIndex((c) => c !== null);
                    if (attackerIdx !== -1)
                      attackMonster(attackerIdx, idx);
                  }}
                />
              ) : (
                "Leer"
              )}
            </div>
          ))}
        </div>

        <div className="hand">Hand: {opponentHandCount}</div>
      </div>

      {/* Eigenes Spielfeld */}
      <div className="player-self">
        <div className="deck">Deck ({deckCount})</div>
        <div className="graveyard">Friedhof ({graveyard.length})</div>

        <div className="shields">
          {shields.map((shield, idx) => (
            <div className="shield" key={idx}>
              {shield ? (
                <img
                  src="/Cards-Ordner/img/cards/card_back.png"
                  alt={`Schild ${idx + 1}`}
                  className="card"
                />
              ) : (
                <div className="empty">Zerstört</div>
              )}
            </div>
          ))}
        </div>

        <div className="field">
          {field.map((card, idx) => (
            <div className="monsterzone" key={idx}>
              {card ? (
                <img src={card.bild} alt="" className="card" />
              ) : (
                "Leer"
              )}
            </div>
          ))}
        </div>

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

        <button onClick={regenerateShield}>Ass abwerfen für Schild</button>
      </div>
    </div>
  );
}

export default Gameboard;
