import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Lobby from './pages/Lobby';
import RoleReveal from './pages/RoleReveal';
import Game from './pages/Game';
import GameOver from './pages/GameOver';

export default function App() {
  const { connected, gameState, privateState, roleData, voteResult, error, setError, emit, getSocketId } = useSocket();
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('tp_name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [abilityResult, setAbilityResult] = useState(null);

  useEffect(() => {
    if (playerName) localStorage.setItem('tp_name', playerName);
  }, [playerName]);

  const createRoom = async () => {
    if (!playerName.trim()) return setError('Zadej jméno.');
    const res = await emit('create_room', { playerName: playerName.trim() });
    if (res?.success) {
      setRoomCode(res.roomCode);
      setInRoom(true);
    } else {
      setError(res?.error || 'Chyba.');
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim()) return setError('Zadej jméno.');
    if (!roomCode.trim()) return setError('Zadej kód místnosti.');
    const res = await emit('join_room', { roomCode: roomCode.trim(), playerName: playerName.trim() });
    if (res?.success) {
      setRoomCode(res.roomCode);
      setInRoom(true);
    } else {
      setError(res?.error || 'Chyba.');
    }
  };

  const phase = gameState?.phase;
  const socketId = getSocketId();

  // Not connected yet
  if (!connected) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse" style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <p style={{ color: 'var(--text-secondary)' }}>Připojování k serveru...</p>
        </div>
      </div>
    );
  }

  // Not in room yet
  if (!inRoom || !gameState) {
    return (
      <div className="container fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', gap: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 4 }}>
            <span style={{ color: 'var(--red)' }}>TAJNÝ</span>{' '}
            <span style={{ color: 'var(--text-primary)' }}>PUTIN</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Česká satirická politická hra</p>
        </div>

        <input
          className="input"
          placeholder="Tvoje jméno"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={20}
        />

        <button className="btn btn-red" onClick={createRoom}>
          Vytvořit místnost
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>NEBO</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <input
          className="input"
          placeholder="Kód místnosti"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          maxLength={5}
          style={{ textAlign: 'center', letterSpacing: 4, fontWeight: 700, fontSize: 20 }}
        />

        <button className="btn btn-blue" onClick={joinRoom}>
          Připojit se
        </button>

        {error && (
          <div className="fade-in" style={{ textAlign: 'center', color: 'var(--danger)', fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Game over
  if (phase === 'game_over') {
    return <GameOver gameState={gameState} privateState={privateState} socketId={socketId} />;
  }

  // Role reveal
  if (phase === 'role_reveal') {
    return (
      <RoleReveal
        roleData={roleData}
        privateState={privateState}
        gameState={gameState}
        socketId={socketId}
        onReady={() => emit('player_ready')}
      />
    );
  }

  // In-game
  if (phase !== 'lobby') {
    return (
      <Game
        gameState={gameState}
        privateState={privateState}
        socketId={socketId}
        voteResult={voteResult}
        emit={emit}
        error={error}
        abilityResult={abilityResult}
        setAbilityResult={setAbilityResult}
      />
    );
  }

  // Lobby
  return (
    <Lobby
      gameState={gameState}
      socketId={socketId}
      onStart={() => emit('start_game')}
      error={error}
    />
  );
}
