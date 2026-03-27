import { useState, useEffect, useCallback } from 'react';
import socket from './socket.js';
import Lobby from './components/Lobby.jsx';
import RoleReveal from './components/RoleReveal.jsx';
import GameBoard from './components/GameBoard.jsx';
import GameOver from './components/GameOver.jsx';
import RoleWidget from './components/RoleWidget.jsx';

function App() {
  const [screen, setScreen] = useState('join'); // join, lobby, role_reveal, game, game_over
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [roleData, setRoleData] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [abilityResult, setAbilityResult] = useState(null);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room_update', (data) => {
      setRoomData(data);
      if (!data.gameStarted) setScreen('lobby');
    });

    socket.on('role_assigned', (data) => {
      setRoleData(data);
      setScreen('role_reveal');
    });

    socket.on('game_state', (data) => {
      setGameState(data);
      if (data.phase === 'game_over') {
        setScreen('game_over');
      } else if (screen === 'role_reveal') {
        // Don't switch until player confirms
      } else if (screen !== 'game_over') {
        setScreen('game');
      }
    });

    socket.on('error', (data) => {
      setError(data.message || 'Nastala chyba');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_update');
      socket.off('role_assigned');
      socket.off('game_state');
      socket.off('error');
    };
  }, [screen]);

  const createRoom = useCallback(() => {
    if (!playerName.trim()) { setError('Zadej jméno'); return; }
    socket.emit('create_room', { playerName: playerName.trim() }, (res) => {
      if (res.error) { setError(res.error); return; }
      setPlayerId(res.playerId);
      setRoomCode(res.roomCode);
      setError('');
    });
  }, [playerName]);

  const joinRoom = useCallback(() => {
    if (!playerName.trim()) { setError('Zadej jméno'); return; }
    if (!roomCode.trim()) { setError('Zadej kód místnosti'); return; }
    socket.emit('join_room', { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim() }, (res) => {
      if (res.error) { setError(res.error); return; }
      setPlayerId(res.playerId);
      setRoomCode(res.roomCode);
      setError('');
    });
  }, [playerName, roomCode]);

  const startGame = useCallback(() => {
    socket.emit('start_game', {}, (res) => {
      if (res.error) setError(res.error);
    });
  }, []);

  const confirmRole = useCallback(() => {
    socket.emit('role_revealed');
    setScreen('game');
  }, []);

  // Show role widget during game and game_over screens
  const showWidget = (screen === 'game' || screen === 'game_over') && gameState;

  if (screen === 'join') {
    return (
      <div className="screen join-screen">
        <div className="logo-container">
          <div className="logo-icon">☭</div>
          <h1 className="logo">TAJNÝ PUTIN</h1>
          <p className="subtitle">Česká satirická politická hra</p>
          <p className="subtitle-small">6–12 hráčů na mobilech</p>
        </div>

        <div className="form-card">
          <input
            type="text"
            placeholder="Tvoje jméno"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            className="input"
          />
          <input
            type="text"
            placeholder="Kód místnosti"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={5}
            className="input"
          />
          <button className="btn btn-primary btn-glow" onClick={joinRoom}>
            Připojit se
          </button>
          <div className="divider">nebo</div>
          <button className="btn btn-secondary" onClick={createRoom}>
            Vytvořit místnost
          </button>
          {error && <div className="error">{error}</div>}
        </div>

        {!connected && <div className="connection-warning">Připojování k serveru...</div>}
      </div>
    );
  }

  if (screen === 'lobby') {
    return (
      <Lobby
        roomData={roomData}
        playerId={playerId}
        onStart={startGame}
        error={error}
      />
    );
  }

  if (screen === 'role_reveal') {
    return (
      <RoleReveal
        roleData={roleData}
        onConfirm={confirmRole}
      />
    );
  }

  if (screen === 'game_over' && gameState) {
    return (
      <>
        <GameOver
          gameState={gameState}
          playerId={playerId}
        />
        {showWidget && (
          <RoleWidget gameState={gameState} playerName={playerName} />
        )}
      </>
    );
  }

  if (screen === 'game' && gameState) {
    return (
      <>
        <GameBoard
          gameState={gameState}
          playerId={playerId}
          socket={socket}
          abilityResult={abilityResult}
          setAbilityResult={setAbilityResult}
        />
        {showWidget && (
          <RoleWidget gameState={gameState} playerName={playerName} />
        )}
      </>
    );
  }

  return (
    <div className="screen loading-screen">
      <div className="spinner"></div>
      <p>Načítání...</p>
    </div>
  );
}

export default App;
