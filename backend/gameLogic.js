// backend/gameLogic.js

const cardValues = ["4", "5", "6", "7", "8", "9", "10", "Bube", "Dame", "König", "Ass"];
const symbols = {
  rot: ["hearts", "diamonds"],
  schwarz: ["spades", "clubs"],
};

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

function shuffle(deck) {
  const array = [...deck];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

function drawCard(gameState, playerName) {
  const deck = gameState.decks[playerName];
  if (deck.length > 0) {
    const card = deck.pop();
    gameState.hands[playerName].push(card);
  }
}

function playCardToField(gameState, playerName, handIndex, fieldIndex) {
  const hand = gameState.hands[playerName];
  const zones = gameState.fields[playerName].monsterZones;
  if (hand[handIndex] && zones[fieldIndex] === null) {
    const card = hand.splice(handIndex, 1)[0];
    zones[fieldIndex] = card;
    return true;
  }
  return false;
}

function regenerateShield(gameState, playerName) {
  const hand = gameState.hands[playerName];
  const shields = gameState.fields[playerName].shields;
  const aceIndex = hand.findIndex((c) => c.wert === "Ass");
  const shieldIndex = shields.findIndex((s) => !s);
  if (aceIndex !== -1 && shieldIndex !== -1) {
    const ace = hand.splice(aceIndex, 1)[0];
    gameState.fields[playerName].graveyard.push(ace);
    shields[shieldIndex] = true;
    return true;
  }
  return false;
}

function attackMonsterZone(gameState, attacker, attackerIndex, defender, defenderIndex) {
  const attackerZones = gameState.fields[attacker].monsterZones;
  const defenderZones = gameState.fields[defender].monsterZones;
  const getWert = (card) => cardValues.indexOf(card.wert);
  const aCard = attackerZones[attackerIndex];
  const dCard = defenderZones[defenderIndex];
  if (!aCard || !dCard) return false;
  const aW = getWert(aCard);
  const dW = getWert(dCard);
  if (aW > dW) {
    defenderZones[defenderIndex] = null;
    gameState.fields[defender].graveyard.push(dCard);
  } else if (aW < dW) {
    attackerZones[attackerIndex] = null;
    gameState.fields[attacker].graveyard.push(aCard);
  } else {
    attackerZones[attackerIndex] = null;
    defenderZones[defenderIndex] = null;
    gameState.fields[attacker].graveyard.push(aCard);
    gameState.fields[defender].graveyard.push(dCard);
  }
  return true;
}

function nextPhase(gameState) {
  const phases = ["draw", "main", "battle", "end"];
  const idx = phases.indexOf(gameState.phase);
  gameState.phase = phases[(idx + 1) % phases.length];
  if (gameState.phase === "draw") {
    gameState.turn = gameState.players.find(p => p !== gameState.turn);
  }
}

function performAIActions(gameState, aiName) {
  switch (gameState.phase) {
    case "draw":
      drawCard(gameState, aiName);
      break;
    case "main": {
      const hand = gameState.hands[aiName];
      const zones = gameState.fields[aiName].monsterZones;
      for (let i = 0; i < hand.length; i++) {
        for (let j = 0; j < zones.length; j++) {
          if (zones[j] === null && playCardToField(gameState, aiName, i, j)) {
            return;
          }
        }
      }
      break;
    }
    case "battle": {
      const enemy = gameState.players.find(p => p !== aiName);
      const aZones = gameState.fields[aiName].monsterZones;
      const dZones = gameState.fields[enemy].monsterZones;
      for (let i = 0; i < aZones.length; i++) {
        for (let j = 0; j < dZones.length; j++) {
          if (aZones[i] && dZones[j]) {
            attackMonsterZone(gameState, aiName, i, enemy, j);
            return;
          }
        }
      }
      break;
    }
    case "end":
      break;
  }
  nextPhase(gameState);
}

module.exports = {
  generateDeck,
  shuffle,
  createGameState,
  drawCard,
  playCardToField,
  regenerateShield,
  attackMonsterZone,
  nextPhase,
  performAIActions,
};
