const {
  CHARACTERS,
  FACTION_DISTRIBUTION,
  PRESIDENTIAL_POWERS,
  getPresidentialPowerTier,
  PRO_RUSSIAN_POLICY_NAMES,
  PRO_WEST_POLICY_NAMES,
  PHASES,
} = require('./constants');

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createDeck() {
  const deck = [];
  for (let i = 0; i < 11; i++) deck.push({ type: 'proRussian', name: PRO_RUSSIAN_POLICY_NAMES[i] });
  for (let i = 0; i < 6; i++) deck.push({ type: 'proWest', name: PRO_WEST_POLICY_NAMES[i] });
  return shuffle(deck);
}

function createRoom(roomCode, hostId, hostName) {
  return {
    code: roomCode,
    hostId,
    players: [{ id: hostId, name: hostName, connected: true }],
    phase: PHASES.LOBBY,
    game: null,
  };
}

function assignRoles(players) {
  const count = players.length;
  const dist = FACTION_DISTRIBUTION[count];
  if (!dist) return null;

  const factions = [];
  for (let i = 0; i < dist.proWest; i++) factions.push('proWest');
  for (let i = 0; i < dist.proRussian; i++) factions.push('proRussian');
  factions.push('putin');

  const shuffledFactions = shuffle(factions);
  const shuffledCharacters = shuffle(CHARACTERS).slice(0, count);

  return players.map((player, i) => ({
    ...player,
    faction: shuffledFactions[i],
    character: shuffledCharacters[i],
    isPutin: shuffledFactions[i] === 'putin',
    abilityUsed: false,
    alive: true,
    bartosCooldown: false, // for Bartoš double vote
    voteHistory: [],
  }));
}

function startGame(room) {
  const players = assignRoles(room.players);
  if (!players) return null;

  const deck = createDeck();
  const presidentIndex = Math.floor(Math.random() * players.length);

  room.players = players;
  room.game = {
    deck,
    discardPile: [],
    proWestPolicies: 0,
    proRussianPolicies: 0,
    presidentIndex,
    lastPresidentIndex: null,
    lastMinisterIndex: null,
    ministerIndex: null,
    nominatedMinisterIndex: null,
    dualNominees: null,
    failCounter: 0,
    votes: {},
    phase: PHASES.ROLE_REVEAL,
    currentPolicies: [],
    lastDiscardedPolicy: null,
    lastEnactedRoundDiscards: [],
    log: [],
    round: 0,
    vetoUnlocked: false,
    specialElectionReturnIndex: null,
    executionBlockPending: false,
    pavelBlockerId: null,
    winner: null,
    winReason: null,
    readyPlayers: new Set(),
  };

  room.phase = PHASES.ROLE_REVEAL;
  return room;
}

function getAlivePlayers(room) {
  return room.players.filter(p => p.alive);
}

function getAlivePlayerIndices(room) {
  return room.players.reduce((acc, p, i) => {
    if (p.alive) acc.push(i);
    return acc;
  }, []);
}

function advancePresident(room) {
  const game = room.game;
  const alive = getAlivePlayerIndices(room);

  if (game.specialElectionReturnIndex !== null) {
    game.presidentIndex = game.specialElectionReturnIndex;
    game.specialElectionReturnIndex = null;
  } else {
    let next = (game.presidentIndex + 1) % room.players.length;
    while (!room.players[next].alive) {
      next = (next + 1) % room.players.length;
    }
    game.presidentIndex = next;
  }

  game.ministerIndex = null;
  game.nominatedMinisterIndex = null;
  game.dualNominees = null;
  game.votes = {};
  game.round++;

  startNominationPhase(room);
}

function startNominationPhase(room) {
  const game = room.game;
  const president = room.players[game.presidentIndex];

  // Check if president has Fiala's dual nominate ability (unused)
  if (president.character.ability === 'dual_nominate' && !president.abilityUsed) {
    game.phase = PHASES.DUAL_NOMINATE;
  } else {
    game.phase = PHASES.NOMINATE_MINISTER;
  }

  addLog(room, `${president.character.emoji} ${president.name} je nový předseda vlády.`);
}

function getEligibleMinisters(room) {
  const game = room.game;
  const alive = getAlivePlayers(room);
  return alive.filter((p, idx) => {
    const playerIndex = room.players.indexOf(p);
    if (playerIndex === game.presidentIndex) return false;
    if (playerIndex === game.lastMinisterIndex && alive.length > 5) return false;
    if (playerIndex === game.lastPresidentIndex && alive.length > 5) return false;
    return true;
  });
}

function nominateMinister(room, ministerPlayerIndex) {
  const game = room.game;
  game.nominatedMinisterIndex = ministerPlayerIndex;
  game.votes = {};
  game.phase = PHASES.VOTE;

  const minister = room.players[ministerPlayerIndex];
  addLog(room, `${room.players[game.presidentIndex].name} nominuje ${minister.character.emoji} ${minister.name} jako ministra.`);
}

function dualNominate(room, nominee1Index, nominee2Index) {
  const game = room.game;
  const president = room.players[game.presidentIndex];
  president.abilityUsed = true;
  game.dualNominees = [nominee1Index, nominee2Index];
  game.votes = {};
  game.phase = PHASES.VOTE;

  const n1 = room.players[nominee1Index];
  const n2 = room.players[nominee2Index];
  addLog(room, `${president.character.emoji} ${president.name} (Fiala) nominuje dva kandidáty: ${n1.name} a ${n2.name}.`);
}

function castVote(room, playerId, vote) {
  const game = room.game;
  const player = room.players.find(p => p.id === playerId);
  if (!player || !player.alive) return false;

  // Bartoš cooldown check
  if (player.bartosCooldown) {
    player.bartosCooldown = false;
    return 'bartos_skip';
  }

  let voteWeight = 1;
  // Bartoš double vote
  if (player.character.ability === 'double_vote' && !player.abilityUsed && game.votes[playerId] === undefined) {
    // Will be handled when ability is explicitly used
  }

  game.votes[playerId] = { vote, weight: voteWeight };
  player.voteHistory.push({ round: game.round, vote });

  return true;
}

function useDoubleVote(room, playerId) {
  const game = room.game;
  const player = room.players.find(p => p.id === playerId);
  if (!player || player.character.ability !== 'double_vote' || player.abilityUsed) return false;

  if (game.votes[playerId]) {
    game.votes[playerId].weight = 2;
    player.abilityUsed = true;
    player.bartosCooldown = true;
    addLog(room, `💻 ${player.name} (Bartoš) použil dvojitý hlas!`);
    return true;
  }
  return false;
}

function resolveVote(room) {
  const game = room.game;
  const alive = getAlivePlayers(room);

  let yesVotes = 0;
  let noVotes = 0;

  for (const p of alive) {
    const v = game.votes[p.id];
    if (!v) continue;
    if (v.vote === 'yes') yesVotes += v.weight;
    else noVotes += v.weight;
  }

  const passed = yesVotes > noVotes;
  const voteResult = { yes: yesVotes, no: noVotes, passed, votes: {} };

  // Build public vote record
  for (const p of alive) {
    const v = game.votes[p.id];
    if (v) voteResult.votes[p.id] = v.vote;
  }

  if (game.dualNominees) {
    return resolveDualVote(room, voteResult);
  }

  if (passed) {
    game.lastPresidentIndex = game.presidentIndex;
    game.lastMinisterIndex = game.nominatedMinisterIndex;
    game.ministerIndex = game.nominatedMinisterIndex;
    game.failCounter = 0;

    // Check Putin elected as minister with 3+ pro-russian policies
    const minister = room.players[game.ministerIndex];
    if (minister.isPutin && game.proRussianPolicies >= 3) {
      game.phase = PHASES.GAME_OVER;
      game.winner = 'proRussian';
      game.winReason = 'Putin byl zvolen ministrem!';
      addLog(room, '🔴 Putin byl zvolen ministrem! Proruská frakce vyhrává!');
      return { ...voteResult, gameOver: true };
    }

    // Start legislation
    startLegislation(room);
    addLog(room, `Hlasování prošlo (${yesVotes}:${noVotes}). Začíná legislativa.`);
  } else {
    game.failCounter++;
    addLog(room, `Hlasování neprošlo (${yesVotes}:${noVotes}). Failcounter: ${game.failCounter}/3`);

    if (game.failCounter >= 3) {
      enactTopPolicy(room);
    } else {
      advancePresident(room);
    }
  }

  return voteResult;
}

function resolveDualVote(room, voteResult) {
  const game = room.game;
  // For dual nomination, votes are for nominee1 (yes) or nominee2 (no)
  // The one with more votes becomes minister
  const alive = getAlivePlayers(room);

  let votes1 = 0;
  let votes2 = 0;

  for (const p of alive) {
    const v = game.votes[p.id];
    if (!v) continue;
    if (v.vote === 'yes') votes1 += v.weight; // vote for nominee 1
    else votes2 += v.weight; // vote for nominee 2
  }

  const winnerIndex = votes1 >= votes2 ? game.dualNominees[0] : game.dualNominees[1];

  game.nominatedMinisterIndex = winnerIndex;
  game.lastPresidentIndex = game.presidentIndex;
  game.lastMinisterIndex = winnerIndex;
  game.ministerIndex = winnerIndex;
  game.failCounter = 0;

  const minister = room.players[winnerIndex];

  // Check Putin win condition
  if (minister.isPutin && game.proRussianPolicies >= 3) {
    game.phase = PHASES.GAME_OVER;
    game.winner = 'proRussian';
    game.winReason = 'Putin byl zvolen ministrem!';
    addLog(room, '🔴 Putin byl zvolen ministrem! Proruská frakce vyhrává!');
    return { ...voteResult, dualResult: { winner: winnerIndex, votes1, votes2 }, gameOver: true };
  }

  startLegislation(room);
  addLog(room, `${minister.name} zvolen ministrem (${votes1}:${votes2}). Začíná legislativa.`);

  return { ...voteResult, dualResult: { winner: winnerIndex, votes1, votes2 } };
}

function startLegislation(room) {
  const game = room.game;
  ensureDeckHasCards(room, 3);
  game.currentPolicies = game.deck.splice(0, 3);
  game.phase = PHASES.PRESIDENT_DISCARD;
}

function presidentDiscard(room, discardIndex) {
  const game = room.game;
  if (discardIndex < 0 || discardIndex >= game.currentPolicies.length) return false;

  game.lastDiscardedPolicy = game.currentPolicies[discardIndex];
  game.lastEnactedRoundDiscards = [game.currentPolicies[discardIndex]];
  game.currentPolicies.splice(discardIndex, 1);
  game.discardPile.push(game.lastDiscardedPolicy);
  game.phase = PHASES.MINISTER_DISCARD;

  // Check veto power (unlocked after 5 pro-russian policies)
  if (game.proRussianPolicies >= 5) {
    game.vetoUnlocked = true;
  }

  return true;
}

function ministerDiscard(room, discardIndex) {
  const game = room.game;
  if (discardIndex < 0 || discardIndex >= game.currentPolicies.length) return false;

  const discarded = game.currentPolicies[discardIndex];
  game.lastEnactedRoundDiscards.push(discarded);
  game.discardPile.push(discarded);
  game.currentPolicies.splice(discardIndex, 1);

  const enacted = game.currentPolicies[0];
  enactPolicy(room, enacted);

  return true;
}

function requestVeto(room) {
  const game = room.game;
  if (!game.vetoUnlocked) return false;
  game.phase = PHASES.VETO_REQUEST;
  addLog(room, `Ministr požaduje veto!`);
  return true;
}

function resolveVeto(room, approved) {
  const game = room.game;
  if (approved) {
    // Both policies go to discard
    game.discardPile.push(...game.currentPolicies);
    game.currentPolicies = [];
    game.failCounter++;
    addLog(room, `Předseda vlády schválil veto. Failcounter: ${game.failCounter}/3`);

    if (game.failCounter >= 3) {
      enactTopPolicy(room);
    } else {
      advancePresident(room);
    }
  } else {
    game.phase = PHASES.MINISTER_DISCARD;
    addLog(room, `Předseda vlády zamítl veto. Ministr musí vybrat zákon.`);
  }
  return true;
}

function enactPolicy(room, policy) {
  const game = room.game;

  if (policy.type === 'proWest') {
    game.proWestPolicies++;
    addLog(room, `🔵 Přijat prozápadní zákon: ${policy.name} (${game.proWestPolicies}/5)`);

    if (game.proWestPolicies >= 5) {
      game.phase = PHASES.GAME_OVER;
      game.winner = 'proWest';
      game.winReason = '5 prozápadních zákonů přijato!';
      addLog(room, '🔵 Prozápadní frakce vyhrává! 5 prozápadních zákonů na tabuli!');
      return;
    }
  } else {
    game.proRussianPolicies++;
    addLog(room, `🔴 Přijat proruský zákon: ${policy.name} (${game.proRussianPolicies}/6)`);

    if (game.proRussianPolicies >= 6) {
      game.phase = PHASES.GAME_OVER;
      game.winner = 'proRussian';
      game.winReason = '6 proruských zákonů přijato!';
      addLog(room, '🔴 Proruská frakce vyhrává! 6 proruských zákonů na tabuli!');
      return;
    }

    // Check presidential power
    const tier = getPresidentialPowerTier(getAlivePlayers(room).length);
    const power = PRESIDENTIAL_POWERS[tier][game.proRussianPolicies];

    if (power) {
      game.phase = PHASES.PRESIDENTIAL_POWER;
      game.currentPower = power;
      addLog(room, `Předseda vlády získává speciální pravomoc: ${getPowerName(power)}`);

      if (power === 'peek_policies') {
        game.phase = PHASES.PEEK_POLICIES;
        ensureDeckHasCards(room, 3);
        game.peekedPolicies = game.deck.slice(0, 3);
      } else if (power === 'execution') {
        game.phase = PHASES.EXECUTION;
      } else if (power === 'investigate') {
        game.phase = PHASES.INVESTIGATE;
      } else if (power === 'special_election') {
        game.phase = PHASES.SPECIAL_ELECTION;
      }
      return;
    }
  }

  game.currentPolicies = [];
  advancePresident(room);
}

function enactTopPolicy(room) {
  const game = room.game;
  ensureDeckHasCards(room, 1);
  const policy = game.deck.splice(0, 1)[0];
  game.failCounter = 0;
  addLog(room, `⚠️ Failcounter dosáhl 3! Automaticky přijat zákon z balíčku.`);
  enactPolicy(room, policy);
}

function executePlayer(room, targetIndex) {
  const game = room.game;
  const target = room.players[targetIndex];

  // Check for Pavel block
  game.executionTarget = targetIndex;
  game.executionBlockPending = true;
  game.phase = PHASES.EXECUTION_BLOCK;
  game.pavelBlockerId = null;

  // Check if any alive player has Pavel's ability unused
  const pavelPlayer = room.players.find(p =>
    p.alive && p.character.ability === 'block_execution' && !p.abilityUsed && p.id !== room.players[game.presidentIndex].id
  );

  if (!pavelPlayer) {
    return resolveExecution(room);
  }

  addLog(room, `${room.players[game.presidentIndex].name} chce popravit ${target.name}. Generál Pavel může zasáhnout...`);
  return { waitingForPavel: true, pavelPlayerId: pavelPlayer.id };
}

function resolveExecution(room, blocked = false) {
  const game = room.game;
  const target = room.players[game.executionTarget];

  if (blocked) {
    addLog(room, `⭐ Generál Pavel zablokoval popravu ${target.name}!`);
    game.executionBlockPending = false;
    advancePresident(room);
    return { blocked: true };
  }

  target.alive = false;
  game.executionBlockPending = false;
  addLog(room, `☠️ ${target.name} byl/a popraven/a!`);

  if (target.isPutin) {
    game.phase = PHASES.GAME_OVER;
    game.winner = 'proWest';
    game.winReason = 'Putin byl popraven!';
    addLog(room, '🔵 Putin byl popraven! Prozápadní frakce vyhrává!');
    return { gameOver: true };
  }

  advancePresident(room);
  return { executed: true };
}

function investigatePlayer(room, targetIndex) {
  const game = room.game;
  const target = room.players[targetIndex];
  const faction = target.isPutin ? 'proRussian' : target.faction;
  addLog(room, `${room.players[game.presidentIndex].name} prošetřil/a ${target.name}.`);
  advancePresident(room);
  return { faction };
}

function specialElection(room, targetIndex) {
  const game = room.game;
  game.specialElectionReturnIndex = game.presidentIndex;

  // Find next regular president after current
  let nextRegular = (game.presidentIndex + 1) % room.players.length;
  while (!room.players[nextRegular].alive) {
    nextRegular = (nextRegular + 1) % room.players.length;
  }
  game.specialElectionReturnIndex = nextRegular;
  game.presidentIndex = targetIndex;

  addLog(room, `Zvláštní volby! ${room.players[targetIndex].name} se stává předsedou vlády.`);
  startNominationPhase(room);
  return true;
}

function peekPoliciesAcknowledge(room) {
  const game = room.game;
  game.peekedPolicies = null;
  game.currentPolicies = [];
  advancePresident(room);
}

// Character abilities
function useAbility(room, playerId, abilityType, target) {
  const player = room.players.find(p => p.id === playerId);
  if (!player || !player.alive || player.abilityUsed) return { error: 'Schopnost nelze použít.' };

  const game = room.game;

  switch (abilityType) {
    case 'peek_discarded': { // Schillerová
      if (game.phase !== PHASES.MINISTER_DISCARD && game.phase !== PHASES.NOMINATE_MINISTER && game.phase !== PHASES.DUAL_NOMINATE) {
        return { error: 'Tuto schopnost lze použít pouze během legislativy nebo nominace.' };
      }
      if (!game.lastDiscardedPolicy) {
        return { error: 'Zatím nebyl zahozen žádný zákon.' };
      }
      player.abilityUsed = true;
      addLog(room, `💼 ${player.name} (Schillerová) použila svou schopnost!`);
      return { success: true, policy: game.lastDiscardedPolicy };
    }

    case 'return_discarded': { // Havlíček
      if (game.discardPile.length === 0) {
        return { error: 'Odkládací balíček je prázdný.' };
      }
      const lastDiscarded = game.discardPile.pop();
      game.deck.push(lastDiscarded);
      game.deck = shuffle(game.deck);
      player.abilityUsed = true;
      addLog(room, `🚂 ${player.name} (Havlíček) vrátil zahozený zákon zpět do balíčku!`);
      return { success: true };
    }

    case 'block_vote': { // Turek
      if (game.phase !== PHASES.VOTE) {
        return { error: 'Tuto schopnost lze použít pouze během hlasování.' };
      }
      player.abilityUsed = true;
      game.failCounter++;
      addLog(room, `🔥 ${player.name} (Turek) zablokoval hlasování! Failcounter: ${game.failCounter}/3`);

      if (game.failCounter >= 3) {
        enactTopPolicy(room);
      } else {
        advancePresident(room);
      }
      return { success: true, blocked: true };
    }

    case 'peek_deck': { // Macinka
      ensureDeckHasCards(room, 2);
      const top2 = game.deck.slice(0, 2);
      player.abilityUsed = true;
      addLog(room, `🏛️ ${player.name} (Macinka) nahlédl na vrchol balíčku!`);
      return { success: true, policies: top2 };
    }

    case 'force_revote': { // Klaus
      if (game.phase !== PHASES.NOMINATE_MINISTER && game.lastVoteFailed === undefined) {
        return { error: 'Tuto schopnost lze použít pouze po neúspěšném hlasování.' };
      }
      player.abilityUsed = true;
      game.votes = {};
      game.phase = PHASES.VOTE;
      addLog(room, `👴 ${player.name} (Klaus) vynutil opakování hlasování!`);
      return { success: true };
    }

    case 'block_execution': { // Pavel
      if (!game.executionBlockPending) {
        return { error: 'Žádná poprava k zablokování.' };
      }
      player.abilityUsed = true;
      return resolveExecution(room, true);
    }

    case 'self_nominate': { // Okamura
      if (game.phase !== PHASES.NOMINATE_MINISTER && game.phase !== PHASES.DUAL_NOMINATE) {
        return { error: 'Tuto schopnost lze použít pouze během nominace.' };
      }
      const playerIndex = room.players.indexOf(player);
      if (playerIndex === game.presidentIndex) {
        return { error: 'Jako předseda vlády se nemůžeš nominovat sám.' };
      }
      player.abilityUsed = true;
      nominateMinister(room, playerIndex);
      addLog(room, `😤 ${player.name} (Okamura) se nominoval sám jako ministr!`);
      return { success: true, selfNominated: true };
    }

    case 'double_vote': { // Bartoš
      return useDoubleVote(room, playerId) ? { success: true } : { error: 'Nelze použít dvojitý hlas.' };
    }

    case 'peek_last_discarded': { // Nerudová
      if (game.lastEnactedRoundDiscards.length === 0) {
        return { error: 'Žádné zahozené karty z posledního kola.' };
      }
      player.abilityUsed = true;
      addLog(room, `📊 ${player.name} (Nerudová) nahlédla na zahozené karty z posledního kola!`);
      return { success: true, policies: game.lastEnactedRoundDiscards };
    }

    case 'reduce_failcounter': { // Lipavský
      if (game.failCounter <= 0) {
        return { error: 'Failcounter je již na 0.' };
      }
      game.failCounter = Math.max(0, game.failCounter - 1);
      player.abilityUsed = true;
      addLog(room, `✈️ ${player.name} (Lipavský) snížil failcounter na ${game.failCounter}!`);
      return { success: true };
    }

    case 'view_vote_history': { // Rakušan
      if (!target) return { error: 'Musíš vybrat hráče.' };
      const targetPlayer = room.players.find(p => p.id === target);
      if (!targetPlayer) return { error: 'Hráč nenalezen.' };
      player.abilityUsed = true;
      addLog(room, `🚔 ${player.name} (Rakušan) prošetřil historii hlasování hráče ${targetPlayer.name}!`);
      return { success: true, voteHistory: targetPlayer.voteHistory, targetName: targetPlayer.name };
    }

    default:
      return { error: 'Neznámá schopnost.' };
  }
}

function ensureDeckHasCards(room, count) {
  const game = room.game;
  if (game.deck.length < count) {
    game.deck = shuffle([...game.deck, ...game.discardPile]);
    game.discardPile = [];
  }
}

function addLog(room, message) {
  room.game.log.push({ message, timestamp: Date.now() });
  if (room.game.log.length > 50) room.game.log.shift();
}

function getPowerName(power) {
  switch (power) {
    case 'peek_policies': return 'Nahlédnutí na zákony';
    case 'investigate': return 'Prošetření';
    case 'special_election': return 'Zvláštní volby';
    case 'execution': return 'Poprava';
    default: return power;
  }
}

function getPublicGameState(room) {
  if (!room.game) {
    return {
      phase: PHASES.LOBBY,
      players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected })),
      hostId: room.hostId,
      code: room.code,
    };
  }

  const game = room.game;
  return {
    phase: game.phase,
    code: room.code,
    hostId: room.hostId,
    proWestPolicies: game.proWestPolicies,
    proRussianPolicies: game.proRussianPolicies,
    failCounter: game.failCounter,
    presidentIndex: game.presidentIndex,
    ministerIndex: game.ministerIndex,
    nominatedMinisterIndex: game.nominatedMinisterIndex,
    dualNominees: game.dualNominees,
    round: game.round,
    vetoUnlocked: game.vetoUnlocked,
    log: game.log,
    winner: game.winner,
    winReason: game.winReason,
    deckSize: game.deck.length,
    discardSize: game.discardPile.length,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      character: p.character,
      alive: p.alive,
      abilityUsed: p.abilityUsed,
      connected: p.connected,
    })),
    votes: game.phase === PHASES.VOTE ? getVoteStatus(room) : getLastVotes(room),
    executionBlockPending: game.executionBlockPending,
    executionTarget: game.executionTarget,
  };
}

function getVoteStatus(room) {
  // During voting, just show who has voted (not how)
  const result = {};
  for (const p of getAlivePlayers(room)) {
    result[p.id] = room.game.votes[p.id] ? 'voted' : 'waiting';
  }
  return result;
}

function getLastVotes(room) {
  // After voting, show actual votes
  const result = {};
  for (const [id, v] of Object.entries(room.game.votes)) {
    result[id] = v.vote;
  }
  return result;
}

function getPrivateState(room, playerId) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  const game = room.game;
  if (!game) return null;

  const privateState = {
    faction: player.isPutin ? 'putin' : player.faction,
    isPutin: player.isPutin,
    character: player.character,
    abilityUsed: player.abilityUsed,
  };

  // Pro-russian players see each other
  if (player.faction === 'proRussian' || player.isPutin) {
    const playerCount = room.players.length;
    // In games with 7+ players, Putin doesn't know who the others are
    if (player.isPutin && playerCount >= 7) {
      privateState.proRussianPlayers = [];
    } else {
      privateState.proRussianPlayers = room.players
        .filter(p => (p.faction === 'proRussian' || p.isPutin) && p.id !== playerId)
        .map(p => ({ id: p.id, name: p.name, isPutin: p.isPutin }));
    }
  }

  // President sees policies during legislation
  const presidentId = room.players[game.presidentIndex]?.id;
  if (playerId === presidentId && game.phase === PHASES.PRESIDENT_DISCARD) {
    privateState.policies = game.currentPolicies;
  }

  // Minister sees policies during legislation
  const ministerId = game.ministerIndex !== null ? room.players[game.ministerIndex]?.id : null;
  if (playerId === ministerId && (game.phase === PHASES.MINISTER_DISCARD || game.phase === PHASES.VETO_REQUEST)) {
    privateState.policies = game.currentPolicies;
  }

  // President sees peeked policies
  if (playerId === presidentId && game.phase === PHASES.PEEK_POLICIES) {
    privateState.peekedPolicies = game.peekedPolicies;
  }

  return privateState;
}

function playerReady(room, playerId) {
  const game = room.game;
  if (!game || game.phase !== PHASES.ROLE_REVEAL) return false;
  game.readyPlayers.add(playerId);

  const aliveCount = getAlivePlayers(room).length;
  if (game.readyPlayers.size >= aliveCount) {
    game.readyPlayers.clear();
    startNominationPhase(room);
    return true;
  }
  return false;
}

module.exports = {
  createRoom,
  startGame,
  advancePresident,
  nominateMinister,
  dualNominate,
  castVote,
  resolveVote,
  presidentDiscard,
  ministerDiscard,
  requestVeto,
  resolveVeto,
  executePlayer,
  resolveExecution,
  investigatePlayer,
  specialElection,
  peekPoliciesAcknowledge,
  useAbility,
  getPublicGameState,
  getPrivateState,
  getEligibleMinisters,
  getAlivePlayers,
  playerReady,
  PHASES,
};
