export default function Lobby({ gameState, socketId, onStart, error }) {
  const isHost = gameState.hostId === socketId;
  const players = gameState.players || [];
  const canStart = isHost && players.length >= 6;

  return (
    <div className="container fade-in" style={{ paddingTop: 32 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
          <span style={{ color: 'var(--red)' }}>TAJNÝ</span> PUTIN
        </h1>
        <div style={{
          display: 'inline-block',
          background: 'var(--bg-card)',
          padding: '8px 20px',
          borderRadius: 12,
          border: '1px solid var(--border)',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>KÓD MÍSTNOSTI</span>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 6, color: 'var(--gold)' }}>
            {gameState.code}
          </div>
        </div>
      </div>

      <div className="section-title">Hráči ({players.length}/12)</div>
      <div className="card" style={{ marginBottom: 16 }}>
        {players.map((p, i) => (
          <div key={p.id} style={{
            padding: '10px 0',
            borderBottom: i < players.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 600 }}>
              {p.name}
              {p.id === gameState.hostId && <span style={{ color: 'var(--gold)', marginLeft: 8, fontSize: 12 }}>HOST</span>}
            </span>
            {p.id === socketId && (
              <span className="badge badge-blue">Ty</span>
            )}
          </div>
        ))}
      </div>

      {players.length < 6 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Potřeba minimálně 6 hráčů ({6 - players.length} zbývá)
        </p>
      )}

      {isHost ? (
        <button className="btn btn-red" onClick={onStart} disabled={!canStart}>
          {canStart ? 'Spustit hru' : `Čekání na hráče (${players.length}/6)`}
        </button>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
          <div className="pulse">Čekání na hostitele...</div>
        </div>
      )}

      {error && (
        <div className="fade-in" style={{ textAlign: 'center', color: 'var(--danger)', fontSize: 14, marginTop: 12 }}>
          {error}
        </div>
      )}
    </div>
  );
}
