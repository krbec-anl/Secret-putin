function Lobby({ roomData, playerId, onStart, error }) {
  if (!roomData) return null;

  const isHost = roomData.hostId === playerId;
  const canStart = roomData.players.length >= 6;

  return (
    <div className="screen lobby-screen">
      <div>
        <div className="room-code-label">Kód místnosti</div>
        <div className="room-code">{roomData.code}</div>
      </div>

      <div className="player-list">
        <div className="player-list-header">
          <span>Hráči</span>
          <span>{roomData.players.length}/12</span>
        </div>
        {roomData.players.map((p) => (
          <div key={p.id} className="player-item">
            <div className={`player-dot ${p.connected ? '' : 'disconnected'}`} />
            <span className="player-name">{p.name}</span>
            {p.id === roomData.hostId && <span className="host-badge">HOST</span>}
          </div>
        ))}
      </div>

      {isHost && (
        <button
          className="btn btn-primary"
          onClick={onStart}
          disabled={!canStart}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          {canStart
            ? `Spustit hru (${roomData.players.length} hráčů)`
            : `Čekání na hráče (min. 6, nyní ${roomData.players.length})`}
        </button>
      )}

      {!isHost && (
        <p className="waiting-text">Čekání na spuštění hry hostitelem...</p>
      )}

      {error && <div className="error">{error}</div>}

      {roomData.players.length < 6 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          Sdílej kód místnosti <strong>{roomData.code}</strong> ostatním hráčům
        </p>
      )}
    </div>
  );
}

export default Lobby;
