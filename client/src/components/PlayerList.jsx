export default function PlayerList({ players, presidentIndex, ministerIndex, nominatedMinisterIndex, socketId, selectedPlayer, onPlayerClick, getPlayerClickable, votes, phase }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="section-title">Hráči</div>
      <div className="player-grid">
        {players.map((p, i) => {
          const isPresident = i === presidentIndex;
          const isMinister = i === ministerIndex;
          const isNominated = i === nominatedMinisterIndex;
          const isMe = p.id === socketId;
          const clickable = getPlayerClickable(i);
          const selected = i === selectedPlayer || (selectedPlayer?.first === i) || (selectedPlayer?.second === i);
          const vote = votes?.[p.id];

          return (
            <div
              key={p.id}
              className={`player-card ${!p.alive ? 'dead' : ''} ${isPresident ? 'president' : ''} ${isMinister ? 'minister' : ''} ${selected ? 'selected' : ''} ${clickable ? 'clickable' : ''}`}
              onClick={() => clickable && onPlayerClick(i)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{p.character?.emoji}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                    {isMe && <span style={{ color: 'var(--blue)', marginLeft: 4, fontSize: 10 }}>TY</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {p.character?.name}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {isPresident && <span className="badge badge-gold" style={{ fontSize: 10 }}>Premiér</span>}
                {(isMinister || isNominated) && <span className="badge badge-blue" style={{ fontSize: 10 }}>Ministr</span>}
                {!p.abilityUsed && p.alive && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⚡</span>}
                {!p.connected && p.alive && <span style={{ fontSize: 10, color: 'var(--danger)' }}>📡</span>}
              </div>

              {/* Vote indicator */}
              {vote && phase !== 'vote' && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  fontSize: 14,
                }}>
                  {vote === 'yes' ? '👍' : '👎'}
                </div>
              )}
              {vote === 'voted' && phase === 'vote' && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  fontSize: 10, color: 'var(--green)',
                }}>
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
