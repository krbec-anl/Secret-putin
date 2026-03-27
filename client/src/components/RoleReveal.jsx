import { useState } from 'react';

const CHARACTER_EMOJIS = {
  schillerova: '💰', havlicek: '🔄', turek: '🚫', macinka: '🔮',
  klaus: '🏛️', fiala: '🤝', pavel: '🛡️', okamura: '👆',
  bartos: '💻', nerudova: '📊', lipavsky: '🕊️', rakusan: '🔍',
};

function RoleReveal({ roleData, onConfirm }) {
  const [revealed, setRevealed] = useState(false);

  if (!roleData) return null;

  const { character, faction, isPutin, proRussianTeam } = roleData;
  const emoji = CHARACTER_EMOJIS[character.id] || '🎭';
  const factionClass = isPutin ? 'putin' : faction;
  const factionLabel = isPutin ? '☭ PUTIN ☭' : faction === 'pro_west' ? '🇪🇺 PROZÁPADNÍ' : '☭ PRORUSKÝ';

  return (
    <div className="screen role-screen">
      {!revealed ? (
        <div className="reveal-intro">
          <div className="reveal-icon-large">🎭</div>
          <h2 className="reveal-heading">Tvoje role je připravena</h2>
          <p className="reveal-subtext">
            Ujisti se, že nikdo nevidí tvou obrazovku
          </p>
          <button
            className="btn btn-primary btn-glow"
            onClick={() => setRevealed(true)}
            onTouchEnd={(e) => { e.preventDefault(); setRevealed(true); }}
          >
            Odhalit roli
          </button>
        </div>
      ) : (
        <div className="reveal-sequence">
          <div className={`role-card-new ${factionClass}`}>
            <div className="role-card-emoji">{emoji}</div>
            <div className="character-name-large">{character.name}</div>
            {character.satire && (
              <div className="character-satire">{character.satire}</div>
            )}
            <div className="character-ability-text">{character.ability}</div>

            <div className={`faction-reveal-badge ${factionClass}`}>
              {factionLabel}
            </div>

            {isPutin && (
              <div className="putin-solo-info">
                <p>Jsi tajný Putin! Nevíš, kdo jsou tví spojenci.</p>
                <p>Musíš se skrývat a manipulovat ostatní.</p>
              </div>
            )}

            {proRussianTeam && !isPutin && (
              <div className="team-info">
                <h4>☭ Tvůj tým (Proruská frakce):</h4>
                {proRussianTeam.map((m) => (
                  <div key={m.id} className="team-member">
                    <span>{m.name}</span>
                    {m.isPutin && <span className="putin-marker">⭐ PUTIN</span>}
                  </div>
                ))}
              </div>
            )}

            {faction === 'pro_west' && (
              <div className="faction-solo-info">
                <p>Braň demokracii! Přijímej prozápadní zákony a odhal Putina.</p>
              </div>
            )}
          </div>

          <button
            className="btn btn-secondary btn-large"
            onClick={onConfirm}
            onTouchEnd={(e) => { e.preventDefault(); onConfirm(); }}
          >
            Rozumím, pokračovat do hry
          </button>
        </div>
      )}
    </div>
  );
}

export default RoleReveal;
