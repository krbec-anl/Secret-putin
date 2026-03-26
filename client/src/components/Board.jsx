export default function Board({ gameState }) {
  const { proWestPolicies, proRussianPolicies, failCounter, deckSize, discardSize } = gameState;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--red)' }}>TAJNÝ PUTIN</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Balíček: {deckSize} | Odhozené: {discardSize}
        </span>
      </div>

      {/* Pro-West Track */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1 }}>PROZÁPADNÍ</span>
        </div>
        <div className="policy-track">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`policy-slot ${i < proWestPolicies ? 'filled-blue' : ''}`}>
              {i < proWestPolicies && '🔵'}
            </div>
          ))}
        </div>
      </div>

      {/* Pro-Russian Track */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', letterSpacing: 1 }}>PRORUSKÉ</span>
        </div>
        <div className="policy-track">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`policy-slot ${i < proRussianPolicies ? 'filled-red' : ''}`}>
              {i < proRussianPolicies && '🔴'}
            </div>
          ))}
        </div>
      </div>

      {/* Fail Counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1 }}>KRIZE</span>
        <div className="fail-counter">
          {[0, 1, 2].map(i => (
            <div key={i} className={`fail-dot ${i < failCounter ? 'active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
