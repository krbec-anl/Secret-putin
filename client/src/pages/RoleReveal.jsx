import { useState } from 'react';

export default function RoleReveal({ roleData, privateState, gameState, socketId, onReady }) {
  const [revealed, setRevealed] = useState(false);
  const [ready, setReady] = useState(false);

  const data = privateState || roleData;
  if (!data) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div className="pulse" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Přidělování rolí...
        </div>
      </div>
    );
  }

  const factionName = data.isPutin ? 'PUTIN' : data.faction === 'proRussian' ? 'Proruská frakce' : 'Prozápadní frakce';
  const factionColor = data.faction === 'proWest' ? 'var(--blue)' : 'var(--red)';
  const character = data.character;

  const handleReady = () => {
    setReady(true);
    onReady();
  };

  if (!revealed) {
    return (
      <div className="container fade-in" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100dvh', gap: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 64 }}>🎭</div>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Tvoje role je připravena</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Ujisti se, že nikdo nevidí tvůj telefon
        </p>
        <button className="btn btn-red" onClick={() => setRevealed(true)}>
          Odhalit roli
        </button>
      </div>
    );
  }

  return (
    <div className="container slide-up" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100dvh', gap: 20, textAlign: 'center',
    }}>
      <div style={{ fontSize: 72, lineHeight: 1 }}>{character.emoji}</div>
      <h2 style={{ fontSize: 28, fontWeight: 900 }}>{character.name}</h2>

      <div style={{
        padding: '8px 24px', borderRadius: 24,
        background: data.faction === 'proWest' ? 'var(--blue-dim)' : 'var(--red-dim)',
        border: `2px solid ${factionColor}`,
        color: factionColor, fontWeight: 800, fontSize: 16,
        boxShadow: `0 0 20px ${data.faction === 'proWest' ? 'var(--blue-glow)' : 'var(--red-glow)'}`,
      }}>
        {factionName}
      </div>

      <div className="card" style={{ width: '100%', textAlign: 'left' }}>
        <div className="section-title">Schopnost</div>
        <p style={{ fontSize: 14 }}>{character.abilityDesc}</p>
      </div>

      {data.isPutin && (
        <div className="card" style={{
          width: '100%', textAlign: 'center',
          borderColor: 'var(--red)', background: 'rgba(220, 38, 38, 0.1)',
        }}>
          <div style={{ fontSize: 32 }}>☭</div>
          <p style={{ color: 'var(--red)', fontWeight: 800, fontSize: 18 }}>Jsi Putin!</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Tvůj tým musí tě dostat k moci nebo prosadit 6 proruských zákonů
          </p>
        </div>
      )}

      {data.proRussianPlayers && data.proRussianPlayers.length > 0 && (
        <div className="card" style={{ width: '100%', textAlign: 'left' }}>
          <div className="section-title">Tvůj tým</div>
          {data.proRussianPlayers.map(p => (
            <div key={p.id} style={{ padding: '4px 0', fontSize: 14 }}>
              {p.isPutin ? '☭ ' : '🔴 '}{p.name}
              {p.isPutin && <span style={{ color: 'var(--red)', fontWeight: 700 }}> (Putin)</span>}
            </div>
          ))}
        </div>
      )}

      {!ready ? (
        <button className="btn btn-outline" onClick={handleReady} style={{ marginTop: 8 }}>
          Rozumím, schovat
        </button>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          <div className="pulse">Čekání na ostatní hráče...</div>
          <p style={{ marginTop: 8, fontSize: 12 }}>
            Připraveno: {gameState.players?.filter((_, i) => gameState.game?.readyPlayers?.has?.(gameState.players[i]?.id)).length || '?'}/{gameState.players?.length}
          </p>
        </div>
      )}
    </div>
  );
}
