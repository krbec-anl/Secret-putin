import { useState } from 'react';

function RoleReveal({ roleData, onConfirm }) {
  const [revealed, setRevealed] = useState(false);

  if (!roleData) return null;

  const { character, faction, isPutin, proRussianTeam } = roleData;
  const cardClass = isPutin ? 'putin' : faction;

  return (
    <div className="screen role-screen">
      {!revealed ? (
        <>
          <h2 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Tvoje role je připravena
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Ujisti se, že nikdo nevidí tvou obrazovku
          </p>
          <button className="btn btn-primary" onClick={() => setRevealed(true)}>
            Odhalit roli
          </button>
        </>
      ) : (
        <>
          <div className={`role-card ${cardClass}`}>
            <div className="character-name">{character.name}</div>
            <div className="character-ability">{character.ability}</div>

            <div className={`faction-badge ${faction}`}>
              {faction === 'pro_west' ? 'PROZÁPADNÍ' : 'PRORUSKÝ'}
            </div>

            {isPutin && (
              <div className="putin-badge">
                ⭐ PUTIN ⭐
              </div>
            )}

            {proRussianTeam && (
              <div className="team-info">
                <h4>Tvůj tým (Proruská frakce):</h4>
                {proRussianTeam.map((m) => (
                  <div key={m.id} className="team-member">
                    <span>{m.name}</span>
                    {m.isPutin && <span className="putin-marker">PUTIN</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-secondary" onClick={onConfirm}>
            Rozumím, schovat
          </button>
        </>
      )}
    </div>
  );
}

export default RoleReveal;
