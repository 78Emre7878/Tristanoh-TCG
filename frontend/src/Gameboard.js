import React, { useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import "./Gameboard.css";

function Gameboard({ playerName, gameState }) {
  const socket = useSocket();
  const [phase, setPhase] = useState("draw");
  const [hand, setHand] = useState([]);
  const [field, setField] = useState([null, null, null]);
  const [deckCount, setDeckCount] = useState(0);
  const [graveyard, setGraveyard] = useState([]);
  const [shields, setShields] = useState([true, true, true, true, true]);

  const isMyTurn = gameState.turn === playerName;
  const opponentName = gameState.players.find((p) => p !== playerName);
  const opponentField = gameState.fields?.[opponentName];
  const opponentHandCount = gameState.hands?.[opponentName]?.length || 0;

  useEffect(() => {
    const playerData = gameState.fields?.[playerName];
    if (!playerData) return;

    setHand(gameState.hands[playerName] || []);
    setField(playerData.monsterZones || [null, null, null]);
    setGraveyard(playerData.graveyard || []);
    setDeckCount(gameState.decks[playerName]?.length || 0);
    setShields(playerData.shields || [true, true, true, true, true]);
    setPhase(gameState.phase || "draw");
  }, [gameState, playerName]);

  const roomId = gameState.roomId;

  const drawCard = () => {
    socket.emit("drawCard", { roomId });
  };

  const playCard = (handIndex, fieldIndex) => {
    socket.emit("playCardToField", { playerName, handIndex, fieldIndex, roomId });
  };

  const endPhase = () => {
    socket.emit("endPhase", { roomId, playerName });
  };

  const regenerateShield = () => {
    socket.emit("regenerateShield", { roomId });
  };

  const attackShield = (shieldIndex) => {
    if (isMyTurn && phase === "battle") {
      socket.emit("attackShield", {
        attacker: playerName,
        target: shieldIndex,
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
  });
};

  return (
    <div className="gameboard">
      <h2>Du bist: {playerName}</h2>

      <div className="phase-bar">
        <strong>Aktuelle Phase:</strong> {phase}
        <p>Zug von: {gameState.turn}</p>
        <button onClick={drawCard} disabled={!isMyTurn || phase !== "draw"}>
          🃏 Karte ziehen
        </button>
        <button onClick={endPhase} disabled={!isMyTurn}>
          🔁 Phase beenden
        </button>
      </div>

      <div className="hand-section">
        <h3>Deine Handkarten:</h3>
        <div className="hand-cards">
          {hand.map((card, idx) => (
            <img
              key={idx}
              src={card.bild}
              alt={`${card.wert} ${card.symbol}`}
              className="card"
              onClick={() =>
                isMyTurn && phase === "main" && playCard(idx, field.findIndex((z) => z === null))
              }
              style={{ cursor: isMyTurn && phase === "main" ? "pointer" : "not-allowed" }}
            />
          ))}
        </div>
      </div>

      <div className="field-section">
        <h3>Feld:</h3>
        <div className="field-zones">
          {field.map((card, idx) => (
            <div key={idx} className="zone">
              {card ? (
                <img src={card.bild} alt={`${card.wert} ${card.symbol}`} className="card" />
              ) : (
                <div className="empty-zone">Leer</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="shield-section">
        <h3>Deine Schilde:</h3>
        <div className="shield-zones">
          {shields.map((shield, idx) => (
            <div key={idx} className="shield">
              {shield ? (
                <img
                  src="/Cards-Ordner/img/cards/card_back.png"
                  alt="Schild aktiv"
                  className="card"
                />
              ) : (
                <div className="empty-zone">Zerstört</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="meta-section">
        <p>Deckkarten: {deckCount}</p>
        <p>Friedhof: {graveyard.length} Karten</p>
        <button onClick={regenerateShield} disabled={!isMyTurn}>
          🛡️ Schild regenerieren
        </button>
      </div>

      <div className="opponent-section">
        <h3>Gegner: {opponentName}</h3>
        <p>Handkarten: {opponentHandCount}</p>

<div className="opponent-field-zones">
  {opponentField?.monsterZones?.map((card, idx) => (
    <div key={idx} className="zone">
      {card ? (
        <img
          src={card.bild}
          alt={`${card.wert} ${card.symbol}`}
          className="card"
          onClick={() => {
            const myAttackerIndex = field.findIndex((c) => c); // Erster Angreifer auf deinem Feld
            attackMonster(myAttackerIndex, idx);
          }}
          style={{
            cursor: isMyTurn && phase === "battle" ? "pointer" : "not-allowed",
            opacity: isMyTurn && phase === "battle" ? 1 : 0.6,
          }}
        />
      ) : (
        <div className="empty-zone">Leer</div>
      )}
    </div>
  ))}
</div>

        <div className="shield-section">
          <h4>Gegnerische Schilde:</h4>
          <div className="shield-zones">
            {opponentField?.shields?.map((shield, idx) => (
              <div
                key={idx}
                className="shield"
                onClick={() => attackShield(idx)}
                style={{
                  cursor: isMyTurn && phase === "battle" && shield ? "pointer" : "not-allowed",
                  opacity: shield ? 1 : 0.5,
                }}
              >
                {shield ? (
                  <img
                    src="/Cards-Ordner/img/cards/card_back.png"
                    alt="Schild"
                    className="card"
                  />
                ) : (
                  <div className="empty-zone">Zerstört</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gameboard;
