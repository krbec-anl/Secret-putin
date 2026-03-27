import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createRoom, joinRoom, getRoom, startGame,
  handleNominateMinister, handleFialaNomination, handleFialaVote,
  handleVote, handlePresidentDiscard, handleMinisterDiscard,
  handleVetoRequest, handleVetoResponse,
  handleExecutiveAction, handleUseAbility,
  handleConfirmVoteResult,
  handleDisconnect, getPublicGameState, getEndGameReveal,
} from './rooms.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/', (req, res) => {
  res.json({ status: 'Tajný Putin server běží' });
});

function broadcastRoomState(room) {
  if (!room.game) {
    io.to(room.code).emit('room_update', {
      code: room.code,
      players: room.players.map(p => ({ id: p.id, name: p.name, connected: p.connected })),
      hostId: room.hostId,
      gameStarted: false,
    });
  } else {
    // Send personalized state to each player
    for (const player of room.players) {
      const socket = io.sockets.sockets.get(player.socketId);
      if (socket) {
        socket.emit('game_state', getPublicGameState(room.game, player.id));
      }
    }
  }
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentPlayerId = null;

  socket.on('create_room', ({ playerName }, callback) => {
    const { room, playerId } = createRoom(playerName, socket.id);
    currentRoom = room;
    currentPlayerId = playerId;
    socket.join(room.code);
    callback({ success: true, roomCode: room.code, playerId });
    broadcastRoomState(room);
  });

  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    const result = joinRoom(roomCode.toUpperCase(), playerName, socket.id);
    if (result.error) {
      callback({ error: result.error });
      return;
    }
    currentRoom = result.room;
    currentPlayerId = result.playerId;
    socket.join(result.room.code);

    if (result.reconnect) {
      callback({ success: true, roomCode: result.room.code, playerId: result.playerId, reconnect: true });
    } else {
      callback({ success: true, roomCode: result.room.code, playerId: result.playerId });
    }
    broadcastRoomState(result.room);
  });

  socket.on('start_game', (_, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    if (currentRoom.hostId !== currentPlayerId) { callback({ error: 'Jen hostitel může spustit hru' }); return; }

    const result = startGame(currentRoom);
    if (result.error) { callback({ error: result.error }); return; }

    callback({ success: true });

    // Send role_assigned to each player
    for (const player of currentRoom.game.players) {
      const s = io.sockets.sockets.get(player.socketId);
      if (s) {
        // Putin does NOT see other pro-russian players
        const showTeam = player.faction === 'pro_russian' && !player.isPutin;
        s.emit('role_assigned', {
          character: player.character,
          faction: player.faction,
          isPutin: player.isPutin,
          proRussianTeam: showTeam
            ? currentRoom.game.players
                .filter(p => p.faction === 'pro_russian')
                .map(p => ({ id: p.id, name: p.name, isPutin: p.isPutin }))
            : null,
        });
      }
    }

    // Do NOT broadcastRoomState here - it would send game_state before
    // players see role_assigned, causing them to skip role reveal.
    // game_state will be sent after all players confirm via role_revealed.
  });

  socket.on('role_revealed', () => {
    if (!currentRoom?.game) return;
    currentRoom.game.roleRevealed[currentPlayerId] = true;

    // Check if all players have revealed
    const allRevealed = currentRoom.game.players.every(
      p => currentRoom.game.roleRevealed[p.id]
    );
    if (allRevealed) {
      currentRoom.game.phase = 'nominate_minister';
      broadcastRoomState(currentRoom);
    }
  });

  socket.on('nominate_minister', ({ targetId }, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handleNominateMinister(currentRoom, currentPlayerId, targetId);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('fiala_nominate', ({ candidate1Id, candidate2Id }, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handleFialaNomination(currentRoom, currentPlayerId, candidate1Id, candidate2Id);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('fiala_vote', ({ candidateId }, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handleFialaVote(currentRoom, currentPlayerId, candidateId);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('vote', ({ vote }, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }

    // Handle Bartos double vote
    const game = currentRoom.game;
    const player = game?.players.find(p => p.id === currentPlayerId);
    if (player?.bartosDoubleVoted && !player.abilityUsed) {
      // Bartos votes count double - add extra vote
    }

    const result = handleVote(currentRoom, currentPlayerId, vote);
    callback(result);
    if (result.success) {
      if (result.resolved) {
        // Small delay so clients can see votes before phase change
        setTimeout(() => broadcastRoomState(currentRoom), 100);
      } else {
        broadcastRoomState(currentRoom);
      }
    }
  });

  socket.on('confirm_vote_result', (_, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handleConfirmVoteResult(currentRoom, currentPlayerId);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('president_discard', ({ discardIndex }, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handlePresidentDiscard(currentRoom, currentPlayerId, discardIndex);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('minister_discard', ({ discardIndex }, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handleMinisterDiscard(currentRoom, currentPlayerId, discardIndex);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('veto_request', (_, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handleVetoRequest(currentRoom, currentPlayerId);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('veto_response', ({ approve }, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handleVetoResponse(currentRoom, currentPlayerId, approve);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('executive_action', ({ action, targetId }, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handleExecutiveAction(currentRoom, currentPlayerId, action, targetId);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('use_ability', ({ targetId }, callback) => {
    if (!currentRoom) { callback({ error: 'Nejsi v místnosti' }); return; }
    const result = handleUseAbility(currentRoom, currentPlayerId, targetId);
    callback(result);
    if (result.success) broadcastRoomState(currentRoom);
  });

  socket.on('disconnect', () => {
    const result = handleDisconnect(socket.id);
    if (result) {
      result.room.game?.log.push(`${result.player.name} se odpojil/a`);
      broadcastRoomState(result.room);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Tajný Putin server běží na portu ${PORT}`);
});
