const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {
  createRoom,
  startGame,
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
} = require('./gameLogic');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();
const playerRooms = new Map(); // socketId -> roomCode

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function broadcastRoomState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const publicState = getPublicGameState(room);

  for (const player of room.players) {
    const socketId = player.id;
    const privateState = room.game ? getPrivateState(room, player.id) : null;
    io.to(socketId).emit('room_update', { ...publicState, private: privateState });
  }
}

function handleError(socket, message) {
  socket.emit('error', { message });
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('create_room', ({ playerName }, callback) => {
    let code;
    do { code = generateRoomCode(); } while (rooms.has(code));

    const room = createRoom(code, socket.id, playerName);
    rooms.set(code, room);
    playerRooms.set(socket.id, code);
    socket.join(code);

    console.log(`Room ${code} created by ${playerName}`);
    callback({ success: true, roomCode: code });
    broadcastRoomState(code);
  });

  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    const code = roomCode.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      return callback({ success: false, error: 'Místnost nenalezena.' });
    }

    if (room.phase !== PHASES.LOBBY) {
      // Check if reconnecting
      const existingPlayer = room.players.find(p => p.name === playerName && !p.connected);
      if (existingPlayer) {
        const oldSocketId = existingPlayer.id;
        existingPlayer.id = socket.id;
        existingPlayer.connected = true;
        playerRooms.set(socket.id, code);
        socket.join(code);
        console.log(`Player ${playerName} reconnected to room ${code}`);
        callback({ success: true, roomCode: code, reconnected: true });
        broadcastRoomState(code);
        return;
      }
      return callback({ success: false, error: 'Hra již probíhá.' });
    }

    if (room.players.length >= 12) {
      return callback({ success: false, error: 'Místnost je plná.' });
    }

    if (room.players.find(p => p.name === playerName)) {
      return callback({ success: false, error: 'Jméno je již obsazené.' });
    }

    room.players.push({ id: socket.id, name: playerName, connected: true });
    playerRooms.set(socket.id, code);
    socket.join(code);

    console.log(`${playerName} joined room ${code}`);
    callback({ success: true, roomCode: code });
    broadcastRoomState(code);
  });

  socket.on('start_game', (_, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);

    if (!room) return callback?.({ success: false, error: 'Místnost nenalezena.' });
    if (room.hostId !== socket.id) return callback?.({ success: false, error: 'Pouze hostitel může spustit hru.' });
    if (room.players.length < 6) return callback?.({ success: false, error: 'Minimálně 6 hráčů.' });
    if (room.players.length > 12) return callback?.({ success: false, error: 'Maximálně 12 hráčů.' });

    const result = startGame(room);
    if (!result) return callback?.({ success: false, error: 'Chyba při spuštění hry.' });

    console.log(`Game started in room ${code} with ${room.players.length} players`);
    callback?.({ success: true });

    // Send role assignments privately
    for (const player of room.players) {
      const privateState = getPrivateState(room, player.id);
      io.to(player.id).emit('role_assigned', privateState);
    }

    broadcastRoomState(code);
  });

  socket.on('player_ready', (_, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return;

    const allReady = playerReady(room, socket.id);
    callback?.({ success: true });
    broadcastRoomState(code);
  });

  socket.on('nominate_minister', ({ ministerIndex }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    const game = room.game;
    if (room.players[game.presidentIndex].id !== socket.id) {
      return callback?.({ success: false, error: 'Nejsi předseda vlády.' });
    }
    if (game.phase !== PHASES.NOMINATE_MINISTER) {
      return callback?.({ success: false, error: 'Nyní nelze nominovat.' });
    }

    const eligible = getEligibleMinisters(room);
    const target = room.players[ministerIndex];
    if (!eligible.find(p => p.id === target.id)) {
      return callback?.({ success: false, error: 'Tento hráč nemůže být ministr.' });
    }

    nominateMinister(room, ministerIndex);
    callback?.({ success: true });
    broadcastRoomState(code);
  });

  socket.on('dual_nominate', ({ nominee1Index, nominee2Index }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    const game = room.game;
    if (room.players[game.presidentIndex].id !== socket.id) {
      return callback?.({ success: false, error: 'Nejsi předseda vlády.' });
    }
    if (game.phase !== PHASES.DUAL_NOMINATE) {
      return callback?.({ success: false, error: 'Nyní nelze nominovat.' });
    }

    dualNominate(room, nominee1Index, nominee2Index);
    callback?.({ success: true });
    broadcastRoomState(code);
  });

  socket.on('vote', ({ vote }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    const game = room.game;
    if (game.phase !== PHASES.VOTE) {
      return callback?.({ success: false, error: 'Nyní nelze hlasovat.' });
    }

    const result = castVote(room, socket.id, vote);
    if (result === 'bartos_skip') {
      callback?.({ success: true, skipped: true });
      broadcastRoomState(code);
      return;
    }
    if (!result) return callback?.({ success: false, error: 'Nelze hlasovat.' });

    // Check if all alive players voted
    const alive = getAlivePlayers(room);
    const allVoted = alive.every(p => game.votes[p.id] || p.bartosCooldown);

    callback?.({ success: true });

    if (allVoted) {
      const voteResult = resolveVote(room);
      io.to(code).emit('vote_result', voteResult);
    }

    broadcastRoomState(code);
  });

  socket.on('discard_policy', ({ index }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    const game = room.game;

    if (game.phase === PHASES.PRESIDENT_DISCARD) {
      if (room.players[game.presidentIndex].id !== socket.id) {
        return callback?.({ success: false, error: 'Nejsi předseda vlády.' });
      }
      if (!presidentDiscard(room, index)) {
        return callback?.({ success: false, error: 'Neplatný výběr.' });
      }
    } else if (game.phase === PHASES.MINISTER_DISCARD) {
      if (room.players[game.ministerIndex].id !== socket.id) {
        return callback?.({ success: false, error: 'Nejsi ministr.' });
      }
      if (!ministerDiscard(room, index)) {
        return callback?.({ success: false, error: 'Neplatný výběr.' });
      }
    } else {
      return callback?.({ success: false, error: 'Nyní nelze zahodit zákon.' });
    }

    callback?.({ success: true });
    broadcastRoomState(code);
  });

  socket.on('request_veto', (_, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    if (!requestVeto(room)) {
      return callback?.({ success: false, error: 'Veto nelze použít.' });
    }
    callback?.({ success: true });
    broadcastRoomState(code);
  });

  socket.on('resolve_veto', ({ approved }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    const game = room.game;
    if (room.players[game.presidentIndex].id !== socket.id) {
      return callback?.({ success: false, error: 'Nejsi předseda vlády.' });
    }

    resolveVeto(room, approved);
    callback?.({ success: true });
    broadcastRoomState(code);
  });

  socket.on('execute_player', ({ targetIndex }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    const game = room.game;
    if (room.players[game.presidentIndex].id !== socket.id) {
      return callback?.({ success: false, error: 'Nejsi předseda vlády.' });
    }
    if (game.phase !== PHASES.EXECUTION) {
      return callback?.({ success: false, error: 'Nyní nelze provést popravu.' });
    }

    const result = executePlayer(room, targetIndex);
    callback?.({ success: true, result });
    broadcastRoomState(code);
  });

  socket.on('block_execution', ({ block }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    if (block) {
      const result = useAbility(room, socket.id, 'block_execution');
      callback?.({ success: !result.error, ...result });
    } else {
      resolveExecution(room, false);
      callback?.({ success: true });
    }
    broadcastRoomState(code);
  });

  socket.on('investigate_player', ({ targetIndex }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    const game = room.game;
    if (room.players[game.presidentIndex].id !== socket.id) {
      return callback?.({ success: false, error: 'Nejsi předseda vlády.' });
    }
    if (game.phase !== PHASES.INVESTIGATE) {
      return callback?.({ success: false, error: 'Nyní nelze prošetřovat.' });
    }

    const result = investigatePlayer(room, targetIndex);
    callback?.({ success: true, ...result });
    broadcastRoomState(code);
  });

  socket.on('special_election', ({ targetIndex }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    const game = room.game;
    if (room.players[game.presidentIndex].id !== socket.id) {
      return callback?.({ success: false, error: 'Nejsi předseda vlády.' });
    }
    if (game.phase !== PHASES.SPECIAL_ELECTION) {
      return callback?.({ success: false, error: 'Nyní nelze vyhlásit zvláštní volby.' });
    }

    specialElection(room, targetIndex);
    callback?.({ success: true });
    broadcastRoomState(code);
  });

  socket.on('peek_acknowledge', (_, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    peekPoliciesAcknowledge(room);
    callback?.({ success: true });
    broadcastRoomState(code);
  });

  socket.on('use_ability', ({ abilityType, target }, callback) => {
    const code = playerRooms.get(socket.id);
    const room = rooms.get(code);
    if (!room?.game) return callback?.({ success: false });

    const result = useAbility(room, socket.id, abilityType, target);
    callback?.({ success: !result.error, ...result });
    broadcastRoomState(code);
  });

  socket.on('disconnect', () => {
    const code = playerRooms.get(socket.id);
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.connected = false;
      console.log(`Player ${player.name} disconnected from room ${code}`);
    }

    // If in lobby and all disconnected, clean up room
    if (room.phase === PHASES.LOBBY) {
      room.players = room.players.filter(p => p.connected);
      if (room.players.length === 0) {
        rooms.delete(code);
        console.log(`Room ${code} deleted (empty)`);
        return;
      }
      // Transfer host if needed
      if (!room.players.find(p => p.id === room.hostId)) {
        room.hostId = room.players[0].id;
      }
    }

    playerRooms.delete(socket.id);
    broadcastRoomState(code);
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Tajný Putin server running on port ${PORT}`);
});
