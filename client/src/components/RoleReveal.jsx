import { useState } from 'react';

const CHARACTER_EMOJIS = {
  schillerova: '💰',
  havlicek: '🔄',
  turek: '🚫',
  macinka: '🔮',
  klaus: '🏛️',
  fiala: '🤝',
  pavel: '🛡️',
  okamura: '👆',
  bartos: '💻',
  nerudova: '📊',
  lipavsky: '🕊️',
  rakusan: '🔍',
};

function RoleReveal({ roleData, onConfirm }) {
  const [revealed, setRevealed] = useState(false);
  const [stage, setStage] = useState(0); // 0=hidden, 1=character, 2=faction, 3=full

  if (!roleData) return null;

  const { character, faction, isPutin, proRussianTeam } = roleData;
  const emoji = CHARACTER_EMOJIS[character.id] || '🎭';

  const handleRevealStep = () => {
    if (stage < 3) {
      setStage(s => s + 1);
      if (stage === 0) setRevealed(true);
    }
  };

  const getFactionLabel = () => {
    if (isPutin) return '☭ PUTIN ☭';
    return faction === 'pro_west' ? '🇪🇺 PROZÁPADNÍ' : '☭ PRORUSKÝ';
  };

  const getFactionClass = () => {
    if (isPutin) return 'putin';
    return faction;
  };

  return (
    <div className="screen role-screen">
      {!revealed ? (
        <div className="reveal-intro">
          <div className="reveal-icon-large">🎭</div>
          <h2 className="reveal-heading">Tvoje role je připravena</h2>
          <p className="reveal-subtext">
            Ujisti se, že nikdo nevidí tvou obrazovku
          </p>
          <button className="btn btn-primary btn-glow" onClick={handleRevealStep}>
            Odhalit roli
          </button>
        </div>
      ) : (
        <div className="reveal-sequence">
          {/* Stage 1: Character reveal */}
          <div className={`role-card-new ${getFactionClass()} ${stage >= 2 ? 'revealed' : ''}`}>
            <div className="role-card-emoji">{emoji}</div>
            <div className="character-name-large">{character.name}</div>
            <div className="character-ability-text">{character.ability}</div>

            {/* Stage 2: Faction reveal */}
            {stage >= 2 && (
              <div className={`faction-reveal-badge ${getFactionClass()}`}>
                {getFactionLabel()}
              </div>
            )}

            {/* Stage 3: Team info (only for non-Putin pro-russian) */}
            {stage >= 3 && isPutin && (
              <div className="putin-solo-info">
                <p>Jsi tajný Putin! Nevíš, kdo jsou tví spojenci.</p>
                <p>Musíš se skrývat a manipulovat ostatní.</p>
              </div>
            )}

            {stage >= 3 && proRussianTeam && !isPutin && (
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

            {stage >= 3 && faction === 'pro_west' && (
              <div className="faction-solo-info">
                <p>Braň demokracii! Přijímej prozápadní zákony a odhal Putina.</p>
              </div>
            )}
          </div>

          {stage < 3 ? (
            <button className="btn btn-primary btn-glow" onClick={handleRevealStep}>
              {stage === 1 ? 'Odhalit frakci' : 'Zobrazit detaily'}
            </button>
          ) : (
            <button className="btn btn-secondary btn-large" onClick={onConfirm}>
              Rozumím, schovat
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default RoleReveal;
