export default function GameOver({ gameState, privateState, socketId }) {
  const { winner, winReason, players } = gameState;
  const isProWestWin = winner === 'proWest';

  const putin = players.find(p => {
    // We can detect Putin from character or we check private state
    return false; // Will be revealed via server
  });

  return (
    <div className="container slide-up" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100dvh', gap: 20, textAlign: 'center',
    }}>
      <div style={{
        fontSize: 80,
        textShadow: isProWestWin ? '0 0 40px var(--blue-glow)' : '0 0 40px var(--red-glow)',
      }}>
        {isProWestWin ? '🔵' : '🔴'}
      </div>

      <h1 style={{
        fontSize: 32, fontWeight: 900,
        color: isProWestWin ? 'var(--blue)' : 'var(--red)',
      }}>
        {isProWestWin ? 'Prozápadní frakce vyhrává!' : 'Proruská frakce vyhrává!'}
      </h1>

      <p style={{ fontSize: 18, color: 'var(--text-secondary)' }}>{winReason}</p>

      <div className="card" style={{ width: '100%', textAlign: 'left', marginTop: 16 }}>
        <div className="section-title">Odhalení rolí</div>
        {players.map((p, i) => {
          const faction = p.character ? (
            privateState?.faction === 'putin' || privateState?.proRussianPlayers
              ? null // handled below
              : null
          ) : null;

          return (
            <div key={p.id} style={{
              padding: '8px 0',
              borderBottom: i < players.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              opacity: p.alive ? 1 : 0.5,
            }}>
              <div>
                <span style={{ marginRight: 8 }}>{p.character?.emoji}</span>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                {!p.alive && <span style={{ color: 'var(--danger)', marginLeft: 8, fontSize: 12 }}>☠️</span>}
              </div>
              <span style={{ fontSize: 12 }}>{p.character?.name}</span>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '12px 24px', borderRadius: 12,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        width: '100%',
      }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Prozápadní zákony: <strong style={{ color: 'var(--blue)' }}>{gameState.proWestPolicies}/5</strong>
          {' | '}
          Proruské zákony: <strong style={{ color: 'var(--red)' }}>{gameState.proRussianPolicies}/6</strong>
        </p>
      </div>

      <button className="btn btn-outline" onClick={() => window.location.reload()} style={{ marginTop: 8 }}>
        Nová hra
      </button>
    </div>
  );
}
