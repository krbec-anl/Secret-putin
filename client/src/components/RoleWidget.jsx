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

function RoleWidget({ gameState, playerName }) {
  const [expanded, setExpanded] = useState(false);

  if (!gameState) return null;

  const faction = gameState.myFaction;
  const isPutin = gameState.myIsPutin;
  const character = gameState.myCharacter;
  if (!character) return null;

  const emoji = CHARACTER_EMOJIS[character.id] || '🎭';
  const factionLabel = isPutin ? 'PUTIN' : faction === 'pro_west' ? 'Prozápadní' : 'Proruský';
  const factionClass = isPutin ? 'putin' : faction;

  return (
    <div className={`role-widget ${factionClass}`}>
      <button
        className="role-widget-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="role-widget-emoji">{emoji}</span>
        <span className="role-widget-name">{playerName}</span>
        <span className="role-widget-arrow">{expanded ? '▼' : '▲'}</span>
      </button>

      {expanded && (
        <div className="role-widget-details">
          <div className="role-widget-character">
            {emoji} {character.name}
          </div>
          <div className={`role-widget-faction ${factionClass}`}>
            {isPutin ? '☭ PUTIN ☭' : factionLabel}
          </div>
          <div className="role-widget-ability">
            {character.ability}
          </div>
          {gameState.proRussianTeam && !isPutin && (
            <div className="role-widget-team">
              <strong>Tým:</strong>{' '}
              {gameState.proRussianTeam.map(m =>
                m.isPutin ? `${m.name} (Putin)` : m.name
              ).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RoleWidget;
