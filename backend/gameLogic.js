// backend/gameLogic.js

const cardValues = ["4", "5", "6", "7", "8", "9", "10", "Bube", "Dame", "König", "Ass"];
const symbols = {
  rot: ["hearts", "diamonds"],
  schwarz: ["spades", "clubs"],
};

// Bildpfade
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

// Deck-Erstellung
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

  // Joker hinzufügen
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

// Deck mischen
function shuffle(deck) {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// GameState erzeugen
function createGameState(players, roomId) {
  const redDeck = shuffle(generateDeck("rot"));
  const blackDeck = shuffle(generateDeck("schwarz"));

  return {
    roomId,
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
  const deck = gameState.decks[playerName];
  const hand = gameState.hands[playerName];
  if (!deck || !hand || deck.length === 0) return;
  const card = deck.pop();
  hand.push(card);
}

// Karte aufs Feld legen
function playCardToField(gameState, playerName, handIndex, fieldIndex) {
  const hand = gameState.hands[playerName];
  const field = gameState.fields[playerName].monsterZones;

  if (
    handIndex < 0 || handIndex >= hand.length ||
    fieldIndex < 0 || fieldIndex >= field.length ||
    field[fieldIndex] !== null
  ) return false;

  const card = hand.splice(handIndex, 1)[0];
  field[fieldIndex] = card;
  return true;
}

// Karte in den Friedhof verschieben
function moveToGraveyard(gameState, playerName, fieldIndex) {
  const field = gameState.fields[playerName].monsterZones;
  const graveyard = gameState.fields[playerName].graveyard;

  if (fieldIndex < 0 || fieldIndex >= field.length) return false;
  const card = field[fieldIndex];
  if (!card) return false;

  field[fieldIndex] = null;
  graveyard.push(card);
  return true;
}

// Schild regenerieren
function regenerateShield(gameState, playerName) {
  const hand = gameState.hands[playerName];
  const shields = gameState.fields[playerName].shields;
  const graveyard = gameState.fields[playerName].graveyard;

  const aceIndex = hand.findIndex((c) => c.wert === "Ass");
  if (aceIndex === -1) return false;

  const destroyedIndex = shields.findIndex((val) => val === null);
  if (destroyedIndex === -1) return false;

  const ace = hand.splice(aceIndex, 1)[0];
  graveyard.push(ace);
  shields[destroyedIndex] = true;
  return true;
}

// Monsterzone angreifen (nach Kartenwert)
function attackMonsterZone(gameState, attacker, attackerIndex, defender, defenderIndex) {
  const attackerZones = gameState.fields[attacker].monsterZones;
  const defenderZones = gameState.fields[defender].monsterZones;
  const aCard = attackerZones[attackerIndex];
  const dCard = defenderZones[defenderIndex];

  if (!aCard || !dCard) return false;

  const order = ["4", "5", "6", "7", "8", "9", "10", "Bube", "Dame", "König", "Ass"];
  const aValue = order.indexOf(aCard.wert);
  const dValue = order.indexOf(dCard.wert);

  if (aValue > dValue) {
    defenderZones[defenderIndex] = null;
    gameState.fields[defender].graveyard.push(dCard);
  } else if (aValue < dValue) {
    attackerZones[attackerIndex] = null;
    gameState.fields[attacker].graveyard.push(aCard);
  } else {
    // Gleichstand: beide zerstört
    attackerZones[attackerIndex] = null;
    defenderZones[defenderIndex] = null;
    gameState.fields[attacker].graveyard.push(aCard);
    gameState.fields[defender].graveyard.push(dCard);
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
  attackMonsterZone,
};
