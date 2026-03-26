import { useState } from 'react';

export default function VotePanel({ gameState, socketId, onVote, voteResult }) {
  const [voted, setVoted] = useState(false);
  const myVote = gameState.votes?.[socketId];

  const handleVote = (vote) => {
    setVoted(true);
    onVote(vote);
  };

  // Reset voted state when new round starts
  if (myVote === 'waiting' && voted) {
    setVoted(false);
  }

  const president = gameState.players[gameState.presidentIndex];
  const nominee = gameState.nominatedMinisterIndex !== null ? gameState.players[gameState.nominatedMinisterIndex] : null;
  const isDual = gameState.dualNominees !== null;

  if (voteResult) {
    return (
      <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          {voteResult.passed ? '✅ Hlasování prošlo!' : '❌ Hlasování neprošlo!'}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {voteResult.yes} ANO / {voteResult.no} NE
        </p>
      </div>
    );
  }

  if (myVote === 'voted' || voted) {
    return (
      <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
        <p className="pulse" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Čekání na ostatní hlasy...</p>
      </div>
    );
  }

  return (
    <div className="card slide-up" style={{ marginBottom: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        {isDual ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Kdo bude ministr?</p>
            <p style={{ fontSize: 16, fontWeight: 700 }}>
              {gameState.players[gameState.dualNominees[0]]?.name} vs {gameState.players[gameState.dualNominees[1]]?.name}
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {president?.character?.emoji} {president?.name} navrhuje:
            </p>
            <p style={{ fontSize: 20, fontWeight: 700 }}>
              {nominee?.character?.emoji} {nominee?.name}
            </p>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {isDual ? (
          <>
            <button className="btn btn-blue" style={{ flex: 1, fontSize: 18, padding: 20 }}
              onClick={() => handleVote('yes')}>
              {gameState.players[gameState.dualNominees[0]]?.character?.emoji} {gameState.players[gameState.dualNominees[0]]?.name}
            </button>
            <button className="btn btn-red" style={{ flex: 1, fontSize: 18, padding: 20 }}
              onClick={() => handleVote('no')}>
              {gameState.players[gameState.dualNominees[1]]?.character?.emoji} {gameState.players[gameState.dualNominees[1]]?.name}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-green" style={{ flex: 1, fontSize: 18, padding: 20 }}
              onClick={() => handleVote('yes')}>
              👍 ANO
            </button>
            <button className="btn btn-danger" style={{ flex: 1, fontSize: 18, padding: 20 }}
              onClick={() => handleVote('no')}>
              👎 NE
            </button>
          </>
        )}
      </div>
    </div>
  );
}
