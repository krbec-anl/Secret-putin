import { PLAYER_CONFIG, CHARACTERS, POLICY, PHASE, EXECUTIVE_ACTIONS, getBoardSize, PRO_RUSSIAN_LAWS, PRO_WEST_LAWS } from './constants.js';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGame(players) {
  const count = players.length;
  const config = PLAYER_CONFIG[count];
  if (!config) throw new Error(`Neplatný počet hráčů: ${count}`);

  // Assign factions
  const factions = [];
  for (let i = 0; i < config.proWest; i++) factions.push('pro_west');
  for (let i = 0; i < config.proRussian; i++) factions.push('pro_russian');
  factions.push('putin'); // Putin is also pro_russian faction
  const shuffledFactions = shuffle(factions);

  // Assign characters
  const shuffledCharacters = shuffle(CHARACTERS).slice(0, count);

  // Create policy deck
  const deck = [];
  for (let i = 0; i < 11; i++) deck.push(POLICY.PRO_RUSSIAN);
  for (let i = 0; i < 6; i++) deck.push(POLICY.PRO_WEST);

  const gamePlayers = players.map((p, i) => ({
    id: p.id,
    name: p.name,
    socketId: p.socketId,
    character: shuffledCharacters[i],
    faction: shuffledFactions[i] === 'putin' ? 'pro_russian' : shuffledFactions[i],
    isPutin: shuffledFactions[i] === 'putin',
    alive: true,
    abilityUsed: false,
    investigated: false,
    // Bartos tracking
    bartosDoubleVoted: false,
    bartosSkipNextVote: false,
    // Vote history
    voteHistory: [],
  }));

  return {
    players: gamePlayers,
    phase: PHASE.ROLE_REVEAL,
    policyDeck: shuffle(deck),
    discardPile: [],
    proWestPolicies: 0,
    proRussianPolicies: 0,
    presidentIndex: Math.floor(Math.random() * count),
    nextPresidentIndex: null, // for special elections
    ministerIndex: null,
    previousPresidentIndex: null,
    previousMinisterIndex: null,
    failCounter: 0,
    electionTracker: 0,
    vetoUnlocked: false,
    boardSize: getBoardSize(count),
    log: [],
    // Current round state
    drawnPolicies: [],
    discardedByPresident: null,
    lastDiscardedPolicies: [],
    // Fiala special
    fialaCandidates: null,
    // Ability state
    pendingAbility: null,
    // Pavel protection
    pavelProtectedPlayer: null,
    // Klaus retry
    klausRetryAvailable: false,
    // Okamura self-nomination pending
    okamuraPending: false,
    // Track who has revealed roles
    roleRevealed: {},
    // Nominated minister ID
    nominatedMinisterId: null,
    // Votes
    votes: {},
    // Track enacted law names
    enactedLawNames: [],
    // Round number
    round: 1,
  };
}

export function drawPolicies(game, count = 3) {
  if (game.policyDeck.length < count) {
    game.policyDeck = shuffle([...game.policyDeck, ...game.discardPile]);
    game.discardPile = [];
  }
  return game.policyDeck.splice(0, count);
}

export function getPresident(game) {
  return game.players[game.presidentIndex];
}

export function getMinister(game) {
  if (game.ministerIndex === null) return null;
  return game.players[game.ministerIndex];
}

export function getAlivePlayers(game) {
  return game.players.filter(p => p.alive);
}

export function getPlayerById(game, id) {
  return game.players.find(p => p.id === id);
}

export function canBeNominatedAsMinister(game, playerId) {
  const player = getPlayerById(game, playerId);
  if (!player || !player.alive) return false;
  if (player.id === getPresident(game).id) return false;

  const aliveCount = getAlivePlayers(game).length;

  // Previous minister can't be nominated
  if (game.previousMinisterIndex !== null && game.players[game.previousMinisterIndex]?.id === playerId) {
    return false;
  }

  // Previous president can't be nominated (only with > 5 alive players)
  if (aliveCount > 5 && game.previousPresidentIndex !== null && game.players[game.previousPresidentIndex]?.id === playerId) {
    return false;
  }

  return true;
}

export function advancePresident(game) {
  if (game.nextPresidentIndex !== null) {
    game.presidentIndex = game.nextPresidentIndex;
    game.nextPresidentIndex = null;
  } else {
    let next = (game.presidentIndex + 1) % game.players.length;
    while (!game.players[next].alive) {
      next = (next + 1) % game.players.length;
    }
    game.presidentIndex = next;
  }
}

export function enactPolicy(game, policy) {
  if (policy === POLICY.PRO_WEST) {
    game.proWestPolicies++;
    const lawName = PRO_WEST_LAWS[game.proWestPolicies - 1] || 'Prozápadní zákon';
    game.enactedLawNames.push({ type: policy, name: lawName });
    game.log.push(`Přijat prozápadní zákon: ${lawName}`);
  } else {
    game.proRussianPolicies++;
    const lawName = PRO_RUSSIAN_LAWS[game.proRussianPolicies - 1] || 'Proruský zákon';
    game.enactedLawNames.push({ type: policy, name: lawName });
    game.log.push(`Přijat proruský zákon: ${lawName}`);

    // Check veto unlock (5th pro-russian policy on small board)
    if (game.proRussianPolicies >= 5) {
      game.vetoUnlocked = true;
    }
  }
  game.failCounter = 0;
}

export function checkWinCondition(game) {
  // Pro-west wins
  if (game.proWestPolicies >= 5) {
    return { winner: 'pro_west', reason: 'Přijato 5 prozápadních zákonů! Demokracie zvítězila!' };
  }

  // Pro-russian wins by policies
  if (game.proRussianPolicies >= 6) {
    return { winner: 'pro_russian', reason: 'Přijato 6 proruských zákonů! Kreml ovládl vládu!' };
  }

  // Putin executed
  const putin = game.players.find(p => p.isPutin);
  if (putin && !putin.alive) {
    return { winner: 'pro_west', reason: `${putin.name} byl popraven a byl to Putin! Demokracie zvítězila!` };
  }

  // Putin elected as minister after 3+ pro-russian policies
  if (game.proRussianPolicies >= 3 && game.ministerIndex !== null) {
    const minister = game.players[game.ministerIndex];
    if (minister && minister.isPutin) {
      return { winner: 'pro_russian', reason: `${minister.name} byl zvolen ministrem a je to Putin! Kreml zvítězil!` };
    }
  }

  return null;
}

export function getExecutiveAction(game) {
  const actions = EXECUTIVE_ACTIONS[game.boardSize];
  return actions[game.proRussianPolicies] || null;
}

export function getPublicGameState(game, playerId) {
  const player = getPlayerById(game, playerId);
  const president = getPresident(game);
  const minister = getMinister(game);

  const isGameOver = game.phase === PHASE.GAME_OVER;

  const publicPlayers = game.players.map(p => ({
    id: p.id,
    name: p.name,
    character: p.character,
    alive: p.alive,
    abilityUsed: p.abilityUsed,
    investigated: p.investigated,
    // Reveal factions on game over
    ...(isGameOver ? { faction: p.faction, isPutin: p.isPutin } : {}),
  }));

  const state = {
    phase: game.phase,
    players: publicPlayers,
    proWestPolicies: game.proWestPolicies,
    proRussianPolicies: game.proRussianPolicies,
    presidentId: president?.id,
    ministerId: minister?.id,
    nominatedMinisterId: game.nominatedMinisterId,
    previousPresidentIndex: game.previousPresidentIndex,
    previousMinisterIndex: game.previousMinisterIndex,
    failCounter: game.failCounter,
    vetoUnlocked: game.vetoUnlocked,
    log: game.log.slice(-20),
    round: game.round,
    enactedLawNames: game.enactedLawNames,
    votes: game.phase === PHASE.VOTING || game.votes._revealed ? game.votes : {},
    deckCount: game.policyDeck.length,
    fialaCandidates: game.fialaCandidates,
    pendingAbility: game.pendingAbility,
    pavelProtectedPlayer: game.pavelProtectedPlayer,
    ...(isGameOver ? { winner: game.winner } : {}),
  };

  // Player-specific private info
  if (player) {
    state.myFaction = player.faction;
    state.myIsPutin = player.isPutin;
    state.myCharacter = player.character;
    state.myAbilityUsed = player.abilityUsed;
    state.myBartosSkipNextVote = player.bartosSkipNextVote;

    // Pro-russian players see each other, BUT Putin does NOT see his team
    if (player.faction === 'pro_russian' && !player.isPutin) {
      state.proRussianTeam = game.players
        .filter(p => p.faction === 'pro_russian')
        .map(p => ({ id: p.id, name: p.name, isPutin: p.isPutin }));
    }

    // President sees drawn policies
    if (player.id === president?.id && game.phase === PHASE.PRESIDENT_DISCARD) {
      state.drawnPolicies = game.drawnPolicies;
    }

    // Minister sees remaining policies
    if (player.id === minister?.id && game.phase === PHASE.MINISTER_DISCARD) {
      state.ministerPolicies = game.drawnPolicies;
    }
  }

  return state;
}

export function getEndGameReveal(game) {
  return game.players.map(p => ({
    id: p.id,
    name: p.name,
    character: p.character,
    faction: p.faction,
    isPutin: p.isPutin,
    alive: p.alive,
  }));
}
