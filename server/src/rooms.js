import { v4 as uuidv4 } from 'uuid';
import { createGame, drawPolicies, getPresident, getMinister, getAlivePlayers, getPlayerById, canBeNominatedAsMinister, advancePresident, enactPolicy, checkWinCondition, getExecutiveAction, getPublicGameState, getEndGameReveal, POLICY, PHASE } from './game.js';
import { PHASE as P } from './constants.js';

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function createRoom(hostName, hostSocketId) {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const hostId = uuidv4();
  const room = {
    code,
    hostId: hostId,
    players: [{
      id: hostId,
      name: hostName,
      socketId: hostSocketId,
      connected: true,
    }],
    game: null,
  };
  rooms.set(code, room);
  return { room, playerId: hostId };
}

export function joinRoom(code, playerName, socketId) {
  const room = rooms.get(code);
  if (!room) return { error: 'Místnost neexistuje' };
  if (room.game) {
    // Check for reconnect
    const existing = room.players.find(p => p.name === playerName);
    if (existing) {
      existing.socketId = socketId;
      existing.connected = true;
      if (room.game) {
        const gp = room.game.players.find(gp => gp.id === existing.id);
        if (gp) gp.socketId = socketId;
      }
      return { room, playerId: existing.id, reconnect: true };
    }
    return { error: 'Hra již běží' };
  }
  if (room.players.length >= 12) return { error: 'Místnost je plná' };
  if (room.players.find(p => p.name === playerName)) return { error: 'Jméno je již obsazeno' };

  const playerId = uuidv4();
  room.players.push({
    id: playerId,
    name: playerName,
    socketId: socketId,
    connected: true,
  });
  return { room, playerId };
}

export function getRoom(code) {
  return rooms.get(code);
}

export function startGame(room) {
  if (room.players.length < 6) return { error: 'Potřeba minimálně 6 hráčů' };
  if (room.players.length > 12) return { error: 'Maximum je 12 hráčů' };

  room.game = createGame(room.players);
  return { success: true };
}

export function handleNominateMinister(room, playerId, targetId) {
  const game = room.game;
  if (!game || game.phase !== P.NOMINATE_MINISTER) return { error: 'Neplatná fáze' };

  const president = getPresident(game);
  if (president.id !== playerId) return { error: 'Nejsi premiér' };

  // Check if Fiala is president and hasn't used ability
  const presidentPlayer = getPlayerById(game, playerId);
  if (presidentPlayer.character.id === 'fiala' && !presidentPlayer.abilityUsed) {
    // Fiala nominates 2 candidates - handled separately
    return { error: 'Fiala musí nominovat 2 kandidáty' };
  }

  if (!canBeNominatedAsMinister(game, targetId)) return { error: 'Tento hráč nemůže být ministrem' };

  game.nominatedMinisterId = targetId;
  game.phase = P.VOTING;
  game.votes = {};
  game.log.push(`${president.name} nominoval/a ${getPlayerById(game, targetId).name} na ministra`);

  return { success: true };
}

export function handleFialaNomination(room, playerId, candidate1Id, candidate2Id) {
  const game = room.game;
  if (!game) return { error: 'Hra neběží' };

  const president = getPresident(game);
  if (president.id !== playerId) return { error: 'Nejsi premiér' };
  if (president.character.id !== 'fiala') return { error: 'Nejsi Fiala' };

  if (!canBeNominatedAsMinister(game, candidate1Id) || !canBeNominatedAsMinister(game, candidate2Id)) {
    return { error: 'Neplatní kandidáti' };
  }
  if (candidate1Id === candidate2Id) return { error: 'Musíš vybrat dva různé kandidáty' };

  game.fialaCandidates = [candidate1Id, candidate2Id];
  game.phase = P.FIALA_VOTE;
  game.votes = {};
  game.log.push(`${president.name} (Fiala) nominoval/a 2 kandidáty na ministra`);
  president.abilityUsed = true;

  return { success: true };
}

export function handleFialaVote(room, playerId, chosenCandidateId) {
  const game = room.game;
  if (!game || game.phase !== P.FIALA_VOTE) return { error: 'Neplatná fáze' };

  const player = getPlayerById(game, playerId);
  if (!player || !player.alive) return { error: 'Neplatný hráč' };
  if (player.id === getPresident(game).id) return { error: 'Premiér nehlasuje' };

  if (!game.fialaCandidates.includes(chosenCandidateId)) return { error: 'Neplatný kandidát' };

  game.votes[playerId] = chosenCandidateId;

  const aliveNonPresident = getAlivePlayers(game).filter(p => p.id !== getPresident(game).id);
  if (Object.keys(game.votes).length >= aliveNonPresident.length) {
    // Count votes
    const counts = {};
    game.fialaCandidates.forEach(c => counts[c] = 0);
    Object.values(game.votes).forEach(v => counts[v] = (counts[v] || 0) + 1);

    const [c1, c2] = game.fialaCandidates;
    const winnerId = counts[c1] >= counts[c2] ? c1 : c2;

    game.nominatedMinisterId = winnerId;
    game.fialaCandidates = null;
    game.phase = P.VOTING;
    game.votes = {};
    game.log.push(`Hráči zvolili ${getPlayerById(game, winnerId).name} jako kandidáta na ministra`);

    return { success: true, resolved: true };
  }

  return { success: true, resolved: false };
}

export function handleVote(room, playerId, vote) {
  const game = room.game;
  if (!game || game.phase !== P.VOTING) return { error: 'Neplatná fáze' };

  const player = getPlayerById(game, playerId);
  if (!player || !player.alive) return { error: 'Neplatný hráč' };

  // Bartos skip check
  if (player.bartosSkipNextVote) {
    player.bartosSkipNextVote = false;
    game.votes[playerId] = null; // abstain
    player.voteHistory.push({ round: game.round, vote: 'abstain' });
  } else {
    game.votes[playerId] = vote; // 'ja' or 'ne'
    player.voteHistory.push({ round: game.round, vote });

    // Bartos double vote
    if (player.character.id === 'bartos' && !player.abilityUsed && player.bartosDoubleVoted) {
      // Already handled
    }
  }

  const alivePlayers = getAlivePlayers(game);
  const votedCount = Object.keys(game.votes).length;

  if (votedCount >= alivePlayers.length) {
    return resolveVote(game);
  }

  return { success: true, resolved: false };
}

function resolveVote(game) {
  const alivePlayers = getAlivePlayers(game);
  game.votes._revealed = true;

  let jaCount = 0;
  let neCount = 0;

  for (const [pid, v] of Object.entries(game.votes)) {
    if (pid === '_revealed') continue;
    if (v === 'ja') jaCount++;
    else if (v === 'ne') neCount++;
    // null = abstain, doesn't count
  }

  const passed = jaCount > neCount;

  if (passed) {
    game.log.push(`Hlasování prošlo (${jaCount} Ano / ${neCount} Ne)`);

    // Set minister
    const ministerPlayer = game.players.find(p => p.id === game.nominatedMinisterId);
    game.ministerIndex = game.players.indexOf(ministerPlayer);

    // Check Putin win condition
    const winCheck = checkWinCondition(game);
    if (winCheck) {
      game.phase = P.GAME_OVER;
      game.winner = winCheck;
      return { success: true, resolved: true, gameOver: winCheck };
    }

    // Draw policies for president
    game.drawnPolicies = drawPolicies(game, 3);
    game.phase = P.PRESIDENT_DISCARD;
    game.failCounter = 0;

    return { success: true, resolved: true, passed: true };
  } else {
    game.log.push(`Hlasování zamítnuto (${jaCount} Ano / ${neCount} Ne)`);
    game.failCounter++;
    game.klausRetryAvailable = true;

    if (game.failCounter >= 3) {
      // Auto-enact top policy
      const topPolicy = drawPolicies(game, 1)[0];
      enactPolicy(game, topPolicy);
      game.failCounter = 0;
      game.previousPresidentIndex = null;
      game.previousMinisterIndex = null;
      game.log.push('3 neúspěšné vlády! Automaticky přijat zákon z balíčku.');

      const winCheck = checkWinCondition(game);
      if (winCheck) {
        game.phase = P.GAME_OVER;
        game.winner = winCheck;
        return { success: true, resolved: true, gameOver: winCheck };
      }

      game.phase = P.POLICY_ENACTED;
      return { success: true, resolved: true, passed: false, autoEnacted: true };
    }

    // Move to next president
    game.nominatedMinisterId = null;
    game.ministerIndex = null;
    advancePresident(game);
    game.round++;
    game.phase = P.NOMINATE_MINISTER;

    return { success: true, resolved: true, passed: false };
  }
}

export function handlePresidentDiscard(room, playerId, discardIndex) {
  const game = room.game;
  if (!game || game.phase !== P.PRESIDENT_DISCARD) return { error: 'Neplatná fáze' };

  const president = getPresident(game);
  if (president.id !== playerId) return { error: 'Nejsi premiér' };
  if (discardIndex < 0 || discardIndex >= game.drawnPolicies.length) return { error: 'Neplatný index' };

  const discarded = game.drawnPolicies.splice(discardIndex, 1)[0];
  game.discardedByPresident = discarded;
  game.lastDiscardedPolicies = [discarded];
  game.discardPile.push(discarded);

  game.phase = P.MINISTER_DISCARD;
  game.log.push(`${president.name} zahodil/a 1 zákon a poslal/a 2 ministrovi`);

  return { success: true };
}

export function handleMinisterDiscard(room, playerId, discardIndex) {
  const game = room.game;
  if (!game || game.phase !== P.MINISTER_DISCARD) return { error: 'Neplatná fáze' };

  const minister = getMinister(game);
  if (minister.id !== playerId) return { error: 'Nejsi ministr' };
  if (discardIndex < 0 || discardIndex >= game.drawnPolicies.length) return { error: 'Neplatný index' };

  const discarded = game.drawnPolicies.splice(discardIndex, 1)[0];
  game.lastDiscardedPolicies.push(discarded);
  game.discardPile.push(discarded);

  const enacted = game.drawnPolicies[0];
  enactPolicy(game, enacted);
  game.drawnPolicies = [];

  const winCheck = checkWinCondition(game);
  if (winCheck) {
    game.phase = P.GAME_OVER;
    game.winner = winCheck;
    return { success: true, gameOver: winCheck };
  }

  // Check for executive action if pro-russian policy
  if (enacted === POLICY.PRO_RUSSIAN) {
    const action = getExecutiveAction(game);
    if (action) {
      game.phase = P.EXECUTIVE_ACTION;
      game.pendingAbility = { type: action, executedBy: getPresident(game).id };
      game.log.push(`Premiér ${getPresident(game).name} musí provést speciální akci: ${getActionName(action)}`);
      return { success: true, executiveAction: action };
    }
  }

  // Move to next round
  startNextRound(game);
  return { success: true };
}

export function handleVetoRequest(room, playerId) {
  const game = room.game;
  if (!game || game.phase !== P.MINISTER_DISCARD) return { error: 'Neplatná fáze' };
  if (!game.vetoUnlocked) return { error: 'Veto ještě není odemčeno' };

  const minister = getMinister(game);
  if (minister.id !== playerId) return { error: 'Nejsi ministr' };

  game.phase = P.VETO_REQUEST;
  game.log.push(`${minister.name} navrhuje veto!`);
  return { success: true };
}

export function handleVetoResponse(room, playerId, approve) {
  const game = room.game;
  if (!game || game.phase !== P.VETO_REQUEST) return { error: 'Neplatná fáze' };

  const president = getPresident(game);
  if (president.id !== playerId) return { error: 'Nejsi premiér' };

  if (approve) {
    // Discard both policies
    game.discardPile.push(...game.drawnPolicies);
    game.drawnPolicies = [];
    game.failCounter++;
    game.log.push('Premiér schválil veto. Oba zákony zahozeny.');

    if (game.failCounter >= 3) {
      const topPolicy = drawPolicies(game, 1)[0];
      enactPolicy(game, topPolicy);
      game.failCounter = 0;
      game.previousPresidentIndex = null;
      game.previousMinisterIndex = null;
      game.log.push('3 neúspěšné vlády! Automaticky přijat zákon z balíčku.');

      const winCheck = checkWinCondition(game);
      if (winCheck) {
        game.phase = P.GAME_OVER;
        game.winner = winCheck;
        return { success: true, gameOver: winCheck };
      }
    }

    startNextRound(game);
    return { success: true, approved: true };
  } else {
    game.phase = P.MINISTER_DISCARD;
    game.log.push('Premiér zamítl veto. Ministr musí vybrat zákon.');
    return { success: true, approved: false };
  }
}

export function handleExecutiveAction(room, playerId, action, targetId) {
  const game = room.game;
  if (!game || game.phase !== P.EXECUTIVE_ACTION) return { error: 'Neplatná fáze' };

  const president = getPresident(game);
  if (president.id !== playerId) return { error: 'Nejsi premiér' };

  switch (action) {
    case 'peek': {
      const topCards = game.policyDeck.slice(0, 3);
      game.log.push(`${president.name} nahlédl/a na 3 zákony na vrcholu balíčku`);
      startNextRound(game);
      return { success: true, result: { topCards } };
    }

    case 'investigate': {
      const target = getPlayerById(game, targetId);
      if (!target || !target.alive) return { error: 'Neplatný hráč' };
      if (target.investigated) return { error: 'Tento hráč již byl prošetřen' };
      if (target.id === president.id) return { error: 'Nemůžeš prošetřit sám sebe' };

      target.investigated = true;
      game.log.push(`${president.name} prošetřil/a ${target.name}`);
      startNextRound(game);
      return { success: true, result: { faction: target.faction } };
    }

    case 'special_election': {
      const target2 = getPlayerById(game, targetId);
      if (!target2 || !target2.alive) return { error: 'Neplatný hráč' };
      if (target2.id === president.id) return { error: 'Nemůžeš zvolit sám sebe' };

      const targetIndex = game.players.indexOf(target2);
      game.nextPresidentIndex = null;
      game.previousPresidentIndex = game.presidentIndex;
      game.previousMinisterIndex = game.ministerIndex;
      game.presidentIndex = targetIndex;
      game.ministerIndex = null;
      game.nominatedMinisterId = null;
      game.phase = P.NOMINATE_MINISTER;
      game.round++;
      game.votes = {};
      game.klausRetryAvailable = false;
      game.log.push(`${president.name} vyhlásil/a zvláštní volby. Nový premiér: ${target2.name}`);
      return { success: true };
    }

    case 'execution': {
      const target3 = getPlayerById(game, targetId);
      if (!target3 || !target3.alive) return { error: 'Neplatný hráč' };
      if (target3.id === president.id) return { error: 'Nemůžeš popravit sám sebe' };

      // Check Pavel protection
      if (game.pavelProtectedPlayer === target3.id) {
        game.pavelProtectedPlayer = null;
        game.log.push(`Generál Pavel zablokoval popravu ${target3.name}!`);
        startNextRound(game);
        return { success: true, result: { blocked: true, targetName: target3.name } };
      }

      target3.alive = false;
      game.log.push(`${president.name} popravil/a ${target3.name}`);

      const winCheck = checkWinCondition(game);
      if (winCheck) {
        game.phase = P.GAME_OVER;
        game.winner = winCheck;
        return { success: true, gameOver: winCheck };
      }

      startNextRound(game);
      return { success: true, result: { executed: target3.name } };
    }

    default:
      return { error: 'Neznámá akce' };
  }
}

export function handleUseAbility(room, playerId, targetId) {
  const game = room.game;
  if (!game) return { error: 'Hra neběží' };

  const player = getPlayerById(game, playerId);
  if (!player || !player.alive) return { error: 'Neplatný hráč' };
  if (player.abilityUsed) return { error: 'Schopnost již byla použita' };

  const charId = player.character.id;

  switch (charId) {
    case 'schillerova': {
      // Force president to show discarded policy
      if (!game.discardedByPresident) return { error: 'Žádný zákon nebyl zahozen' };
      if (game.phase !== P.MINISTER_DISCARD && game.phase !== P.POLICY_ENACTED && game.phase !== P.EXECUTIVE_ACTION) {
        return { error: 'Schopnost lze použít jen po zahození zákona premiérem' };
      }
      player.abilityUsed = true;
      game.log.push(`${player.name} (Schillerová) vynutila odhalení zahozeného zákona`);
      return { success: true, result: { discardedPolicy: game.discardedByPresident } };
    }

    case 'havlicek': {
      // Return discarded policy to deck
      if (game.lastDiscardedPolicies.length === 0) return { error: 'Žádné zahozené karty' };
      const returned = game.lastDiscardedPolicies[game.lastDiscardedPolicies.length - 1];
      // Remove from discard pile
      const idx = game.discardPile.lastIndexOf(returned);
      if (idx >= 0) game.discardPile.splice(idx, 1);
      game.policyDeck.push(returned);
      player.abilityUsed = true;
      game.log.push(`${player.name} (Havlíček) vrátil zahozený zákon zpět do balíčku`);
      return { success: true };
    }

    case 'turek': {
      // Block entire voting round
      if (game.phase !== P.VOTING && game.phase !== P.NOMINATE_MINISTER) {
        return { error: 'Schopnost lze použít jen během hlasování nebo nominace' };
      }
      player.abilityUsed = true;
      game.failCounter++;
      game.log.push(`${player.name} (Turek) zablokoval hlasování! (+1 failcounter)`);

      if (game.failCounter >= 3) {
        const topPolicy = drawPolicies(game, 1)[0];
        enactPolicy(game, topPolicy);
        game.failCounter = 0;
        game.previousPresidentIndex = null;
        game.previousMinisterIndex = null;
        game.log.push('3 neúspěšné vlády! Automaticky přijat zákon z balíčku.');

        const winCheck = checkWinCondition(game);
        if (winCheck) {
          game.phase = P.GAME_OVER;
          game.winner = winCheck;
          return { success: true, gameOver: winCheck };
        }
      }

      startNextRound(game);
      return { success: true };
    }

    case 'macinka': {
      // Peek at top 2 cards
      if (game.policyDeck.length < 2) return { error: 'Nedostatek karet v balíčku' };
      player.abilityUsed = true;
      const topTwo = game.policyDeck.slice(0, 2);
      game.log.push(`${player.name} (Macinka) nahlédl na 2 karty na vrcholu balíčku`);
      return { success: true, result: { topCards: topTwo } };
    }

    case 'klaus': {
      // Force re-vote on failed election
      if (!game.klausRetryAvailable) return { error: 'Nelze použít veto – nebyl neúspěšný hlas' };
      player.abilityUsed = true;
      game.klausRetryAvailable = false;
      // Go back to voting with same nomination
      game.phase = P.VOTING;
      game.votes = {};
      game.log.push(`${player.name} (Klaus) vynutil opakování hlasování!`);
      return { success: true };
    }

    case 'pavel': {
      // Protect a player from execution
      if (game.phase === P.GAME_OVER) return { error: 'Hra skončila' };
      const target = getPlayerById(game, targetId);
      if (!target || !target.alive) return { error: 'Neplatný hráč' };
      player.abilityUsed = true;
      game.pavelProtectedPlayer = target.id;
      game.log.push(`${player.name} (Pavel) aktivoval ochranu`);
      return { success: true };
    }

    case 'okamura': {
      // Self-nominate as minister
      if (game.phase !== P.NOMINATE_MINISTER) return { error: 'Lze použít jen během nominace' };
      if (!canBeNominatedAsMinister(game, player.id)) return { error: 'Nemůžeš být ministrem v tomto kole' };
      player.abilityUsed = true;
      game.nominatedMinisterId = player.id;
      game.phase = P.VOTING;
      game.votes = {};
      game.log.push(`${player.name} (Okamura) se sám nominoval jako ministr!`);
      return { success: true };
    }

    case 'bartos': {
      // Double vote this round, skip next
      if (game.phase !== P.VOTING) return { error: 'Lze použít jen během hlasování' };
      player.abilityUsed = true;
      player.bartosDoubleVoted = true;
      player.bartosSkipNextVote = true;
      game.log.push(`${player.name} (Bartoš) aktivoval dvojitý hlas! Příští kolo nebude hlasovat.`);
      return { success: true };
    }

    case 'nerudova': {
      // See last discarded policies
      if (game.lastDiscardedPolicies.length === 0) return { error: 'Žádné zahozené karty z posledního kola' };
      player.abilityUsed = true;
      game.log.push(`${player.name} (Nerudová) analyzovala zahozené karty z posledního kola`);
      return { success: true, result: { discardedPolicies: [...game.lastDiscardedPolicies] } };
    }

    case 'lipavsky': {
      // Reduce fail counter by 1
      if (game.failCounter <= 0) return { error: 'Failcounter je již na 0' };
      player.abilityUsed = true;
      game.failCounter = Math.max(0, game.failCounter - 1);
      game.log.push(`${player.name} (Lipavský) snížil failcounter o 1 (nyní: ${game.failCounter})`);
      return { success: true };
    }

    case 'rakusan': {
      // See complete vote history of one player
      const target2 = getPlayerById(game, targetId);
      if (!target2) return { error: 'Neplatný hráč' };
      player.abilityUsed = true;
      game.log.push(`${player.name} (Rakušan) prozkoumal historii hlasování hráče ${target2.name}`);
      return { success: true, result: { voteHistory: target2.voteHistory, targetName: target2.name } };
    }

    default:
      return { error: 'Neznámá schopnost' };
  }
}

function startNextRound(game) {
  game.previousPresidentIndex = game.presidentIndex;
  game.previousMinisterIndex = game.ministerIndex;
  game.ministerIndex = null;
  game.nominatedMinisterId = null;
  game.drawnPolicies = [];
  game.discardedByPresident = null;
  game.votes = {};
  game.klausRetryAvailable = false;
  game.pendingAbility = null;
  game.fialaCandidates = null;

  advancePresident(game);
  game.round++;
  game.phase = P.NOMINATE_MINISTER;
}

function getActionName(action) {
  switch (action) {
    case 'peek': return 'Nahlédnutí na zákony';
    case 'investigate': return 'Prošetření hráče';
    case 'special_election': return 'Zvláštní volby';
    case 'execution': return 'Poprava';
    default: return action;
  }
}

export function handleDisconnect(socketId) {
  for (const [code, room] of rooms.entries()) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) {
      player.connected = false;
      return { room, player };
    }
  }
  return null;
}

export { getPublicGameState, getEndGameReveal };
