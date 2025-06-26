// gameLogic.js

const cardValues = ["4", "5", "6", "7", "8", "9", "10", "Bube", "Dame", "König", "Ass"];
const symbols = {
  rot: ["hearts", "diamonds"],
  schwarz: ["spades", "clubs"],
};

// Kartenpfad
function getCardImagePath(wert, symbol) {
  const valueMap = {
    Bube: "jack",
    Dame: "queen",
    König: "king",
    Ass: "ace",
  };
  const valueString = valueMap[wert] || `${wert}`;
  return `/Cards-Ordner/img/cards/${valueString.toLowerCase()}_of_${symbol.toLowerCase()}.png`;
}

// Deck erzeugen
function generateDeck(color) {
  const deck = [];

  for (const value of cardValues) {
    for (const symbol of symbols[color]) {
      deck.push({
        farbe: color,
        wert: value,
        symbol,
        bild: getCardImagePath(value, symbol),
      });
    }
  }

  deck.push({
    farbe: color,
    wert: "Joker",
    symbol: "joker",
    bild: color === "rot"
      ? "/Cards-Ordner/img/cards/red_joker.png"
      : "/Cards-Ordner/img/cards/black_joker.png",
  });

  return deck;
}

// Shuffle
function shuffle(deck) {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Spielerbereiche initialisieren
function initializePlayerZones(deck) {
  return {
    deck,
    hand: deck.splice(0, 3),
    field: [null, null, null],
    shields: [2, 3],
    graveyard: [],
  };
}

// GameState erzeugen
function createGameState(players, roomId) {
  const redDeck = shuffle(generateDeck("rot"));
  const blackDeck = shuffle(generateDeck("schwarz"));

  return {
    roomId, // ✅ Hier hinzugefügt
    players,
    turn: players[0],
    phase: "draw",

    decks: {
      [players[0]]: redDeck,
      [players[1]]: blackDeck,
    },

    hands: {
      [players[0]]: redDeck.splice(0, 3),
      [players[1]]: blackDeck.splice(0, 3),
    },

    fields: {
      [players[0]]: {
        monsterZones: [null, null, null],
        shields: [true, true, true, true, true],
        graveyard: [],
      },
      [players[1]]: {
        monsterZones: [null, null, null],
        shields: [true, true, true, true, true],
        graveyard: [],
      },
    },
  };
}

// Karte ziehen
function drawCard(gameState, playerName) {
  const player = gameState.zones[playerName];
  if (!player || player.deck.length === 0) return;
  const card = player.deck.shift();
  player.hand.push(card);
  return card;
}

// Karte aufs Feld legen
function playCardToField(gameState, playerName, handIndex, fieldIndex) {
  const player = gameState.zones[playerName];
  if (!player) return false;
  if (
    handIndex < 0 || handIndex >= player.hand.length ||
    fieldIndex < 0 || fieldIndex >= player.field.length ||
    player.field[fieldIndex] !== null
  ) return false;

  const card = player.hand.splice(handIndex, 1)[0];
  player.field[fieldIndex] = card;
  return true;
}

// Karte in den Friedhof verschieben
function moveToGraveyard(gameState, playerName, fieldIndex) {
  const player = gameState.zones[playerName];
  if (!player || fieldIndex < 0 || fieldIndex >= player.field.length) return false;
  const card = player.field[fieldIndex];
  if (!card) return false;

  player.field[fieldIndex] = null;
  player.graveyard.push(card);
  return true;
}

// Schild regenerieren
function regenerateShield(gameState, playerName) {
  const player = gameState.zones[playerName];
  if (!player) return false;

  const aceIndex = player.hand.findIndex((c) => c.wert === "Ass");
  if (aceIndex === -1) return false;

  const shieldIndex = player.shields.findIndex((val) => val < 3);
  if (shieldIndex === -1) return false;

  const ace = player.hand.splice(aceIndex, 1)[0];
  player.graveyard.push(ace);
  player.shields[shieldIndex] = Math.min(3, player.shields[shieldIndex] + 1);
  return true;
}
// Monster angreifen
function attackMonster(gameState, attackerPlayer, attackerIndex, defenderPlayer, defenderIndex) {
  // Beispielhafte Logik
  const attackerField = gameState.fields[attackerPlayer].monsterZones;
  const defenderField = gameState.fields[defenderPlayer].monsterZones;

  const attackerCard = attackerField[attackerIndex];
  const defenderCard = defenderField[defenderIndex];

  if (!attackerCard || !defenderCard) return false;

  // Beispielregel: Beide Karten zerstören sich
  attackerField[attackerIndex] = null;
  defenderField[defenderIndex] = null;

  gameState.fields[attackerPlayer].graveyard.push(attackerCard);
  gameState.fields[defenderPlayer].graveyard.push(defenderCard);

  return true;
}

// Monsterzone angreifen
function attackMonsterZone(gameState, attacker, attackerIndex, defender, defenderIndex) {
  const attackerZones = gameState.fields[attacker].monsterZones;
  const defenderZones = gameState.fields[defender].monsterZones;

  const attackerCard = attackerZones[attackerIndex];
  const defenderCard = defenderZones[defenderIndex];

  if (!attackerCard || !defenderCard) return false;

  // Beispiel-Regel: Die Karte mit dem höheren Wert gewinnt
  const getWert = (card) => {
    const order = ["4", "5", "6", "7", "8", "9", "10", "Bube", "Dame", "König", "Ass"];
    return order.indexOf(card.wert);
  };

  const attackerValue = getWert(attackerCard);
  const defenderValue = getWert(defenderCard);

  if (attackerValue > defenderValue) {
    defenderZones[defenderIndex] = null;
    gameState.fields[defender].graveyard.push(defenderCard);
  } else if (attackerValue < defenderValue) {
    attackerZones[attackerIndex] = null;
    gameState.fields[attacker].graveyard.push(attackerCard);
  } else {
    // Gleichstand: beide zerstört
    attackerZones[attackerIndex] = null;
    defenderZones[defenderIndex] = null;
    gameState.fields[attacker].graveyard.push(attackerCard);
    gameState.fields[defender].graveyard.push(defenderCard);
  }

  return true;
}

module.exports = {
  generateDeck,
  shuffle,
  createGameState,
  drawCard,
  playCardToField,
  moveToGraveyard,
  regenerateShield,
  attackMonster,
  attackMonsterZone
};
