import { useState, useEffect } from 'react';
import socket from '../socket.js';

function GameOver({ gameState, playerId }) {
  const [revealData, setRevealData] = useState(null);
  const gs = gameState;

  // The game state already has all players with their info visible
  // We can derive the reveal from the game state
  const winner = gs.winner || gs.gameOver;

  return (
    <div className="screen game-over-screen">
      <div className={`winner-banner ${winner?.winner || ''}`}>
        <div className="winner-title">
          {winner?.winner === 'pro_west' ? 'DEMOKRACIE ZVÍTĚZILA!' : 'KREML ZVÍTĚZIL!'}
        </div>
        <div className="winner-reason">{winner?.reason}</div>
      </div>

      <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Odhalení rolí</h3>

      <div className="reveal-grid">
        {gs.players.map(p => (
          <div
            key={p.id}
            className={`reveal-card ${p.isPutin ? 'putin-reveal' : ''}`}
          >
            <div>
              <div className="reveal-name">
                {p.name} {!p.alive && '(mrtev/á)'}
              </div>
              <div className="reveal-char">{p.character?.name}</div>
            </div>
            <div>
              {p.isPutin ? (
                <span className="reveal-faction putin">PUTIN</span>
              ) : (
                <span className={`reveal-faction ${p.faction}`}>
                  {p.faction === 'pro_west' ? 'Prozápadní' : 'Proruský'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GameOver;
