export default function PolicySelection({ policies, onSelect, title, subtitle, vetoUnlocked, onVeto }) {
  return (
    <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{subtitle}</p>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: vetoUnlocked ? 12 : 0 }}>
        {policies.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            style={{
              width: 100,
              height: 130,
              borderRadius: 12,
              border: `2px solid ${p.type === 'proRussian' ? 'var(--red)' : 'var(--blue)'}`,
              background: p.type === 'proRussian' ? 'var(--red-dim)' : 'var(--blue-dim)',
              color: 'var(--text-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'transform 0.15s',
              boxShadow: p.type === 'proRussian' ? '0 0 15px var(--red-glow)' : '0 0 15px var(--blue-glow)',
            }}
          >
            <span style={{ fontSize: 28 }}>{p.type === 'proRussian' ? '🔴' : '🔵'}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '0 4px' }}>{p.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {p.type === 'proRussian' ? 'Proruský' : 'Prozápadní'}
            </span>
          </button>
        ))}
      </div>

      {vetoUnlocked && onVeto && (
        <button className="btn btn-outline btn-small" onClick={onVeto}>
          🚫 Požádat o veto
        </button>
      )}
    </div>
  );
}
