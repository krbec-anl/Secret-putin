import { useState } from 'react';

export default function AbilityButton({ character, gameState, socketId, onUseAbility, players }) {
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const ability = character.ability;
  const phase = gameState.phase;

  // Abilities that need a target
  const needsTarget = ability === 'view_vote_history';

  // Abilities that can only be used in specific phases
  const canUse = () => {
    switch (ability) {
      case 'peek_discarded':
        return !!gameState.round && gameState.round > 0;
      case 'return_discarded':
        return gameState.discardSize > 0;
      case 'block_vote':
        return phase === 'vote';
      case 'peek_deck':
        return true;
      case 'force_revote':
        return phase === 'nominate_minister' || phase === 'dual_nominate';
      case 'dual_nominate':
        return false; // Handled automatically
      case 'block_execution':
        return phase === 'execution_block';
      case 'self_nominate':
        return (phase === 'nominate_minister' || phase === 'dual_nominate') && players[gameState.presidentIndex]?.id !== socketId;
      case 'double_vote':
        return phase === 'vote' && gameState.votes?.[socketId] === 'voted';
      case 'peek_last_discarded':
        return !!gameState.round && gameState.round > 0;
      case 'reduce_failcounter':
        return gameState.failCounter > 0;
      case 'view_vote_history':
        return true;
      default:
        return false;
    }
  };

  // Don't show for abilities that are handled in the game flow
  if (ability === 'dual_nominate' || ability === 'block_execution') return null;

  const handleUse = async (target) => {
    setLoading(true);
    await onUseAbility(ability, target);
    setLoading(false);
    setShowTargetPicker(false);
  };

  if (showTargetPicker && needsTarget) {
    return (
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-title">Vyber cíl schopnosti</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {players.filter(p => p.alive && p.id !== socketId).map((p) => (
            <button key={p.id} className="btn btn-outline btn-small"
              style={{ flex: '0 0 auto', fontSize: 12 }}
              onClick={() => handleUse(p.id)}>
              {p.character?.emoji} {p.name}
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-small" style={{ marginTop: 8 }}
          onClick={() => setShowTargetPicker(false)}>
          Zrušit
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        className="btn btn-gold btn-small"
        disabled={!canUse() || loading}
        onClick={() => {
          if (needsTarget) {
            setShowTargetPicker(true);
          } else {
            handleUse();
          }
        }}
      >
        {character.emoji} {character.abilityDesc}
        {!canUse() && ' (nelze nyní)'}
      </button>
    </div>
  );
}
