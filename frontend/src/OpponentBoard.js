import React from "react";
import "./Gameboard.css"; // Du kannst die gleichen Styles verwenden

function OpponentBoard({ opponentName, gameState }) {
  if (!gameState || !gameState.fields?.[opponentName]) return null;

  const field = gameState.fields[opponentName].monsterZones || [];
  const graveyard = gameState.fields[opponentName].graveyard || [];
  const shieldCount = gameState.fields[opponentName].shields?.length || 0;
  const deckCount = gameState.decks?.[opponentName]?.length || 0;

  return (
    <div className="opponent-board">
      <h2>Gegner: {opponentName}</h2>

      <div className="op-hand">
        <p>Handkarten:</p>
        <div className="hand-cards">
          {(gameState.hands?.[opponentName] || []).map((_, idx) => (
            <img
              key={idx}
              src="/Cards-Ordner/img/cards/back.png"
              alt="Kartenrückseite"
              className="card"
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
                <img
                  src={card.bild}
                  alt={`${card.wert} ${card.symbol}`}
                  className="card"
                />
              ) : (
                <div className="empty-zone">Leer</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="meta-section">
        <p>Deckkarten: {deckCount}</p>
        <p>Friedhof: {graveyard.length} Karten</p>
        <p>Schilde: {shieldCount}</p>
      </div>
    </div>
  );
}

export default OpponentBoard;
