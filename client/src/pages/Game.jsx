import { useState, useEffect } from 'react';
import Board from '../components/Board';
import PlayerList from '../components/PlayerList';
import GameLog from '../components/GameLog';
import VotePanel from '../components/VotePanel';
import PolicySelection from '../components/PolicySelection';
import AbilityButton from '../components/AbilityButton';
import PhaseInfo from '../components/PhaseInfo';

export default function Game({ gameState, privateState, socketId, voteResult, emit, error, abilityResult, setAbilityResult }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [investigateResult, setInvestigateResult] = useState(null);

  const { phase, players, presidentIndex, ministerIndex, nominatedMinisterIndex, dualNominees } = gameState;
  const me = players.find(p => p.id === socketId);
  const meIndex = players.findIndex(p => p.id === socketId);
  const isPresident = presidentIndex !== undefined && players[presidentIndex]?.id === socketId;
  const isMinister = ministerIndex !== null && players[ministerIndex]?.id === socketId;

  const handleNominate = async () => {
    if (selectedPlayer === null) return;
    const res = await emit('nominate_minister', { ministerIndex: selectedPlayer });
    if (res?.success) setSelectedPlayer(null);
  };

  const handleDualNominate = async () => {
    if (!selectedPlayer || typeof selectedPlayer !== 'object') return;
    const { first, second } = selectedPlayer;
    if (first === undefined || second === undefined) return;
    const res = await emit('dual_nominate', { nominee1Index: first, nominee2Index: second });
    if (res?.success) setSelectedPlayer(null);
  };

  const handleVote = async (vote) => {
    await emit('vote', { vote });
  };

  const handleDiscard = async (index) => {
    await emit('discard_policy', { index });
  };

  const handleVetoRequest = async () => {
    await emit('request_veto');
  };

  const handleVetoResolve = async (approved) => {
    await emit('resolve_veto', { approved });
  };

  const handleExecute = async () => {
    if (selectedPlayer === null) return;
    const res = await emit('execute_player', { targetIndex: selectedPlayer });
    if (res?.success) setSelectedPlayer(null);
  };

  const handleBlockExecution = async (block) => {
    await emit('block_execution', { block });
  };

  const handleInvestigate = async () => {
    if (selectedPlayer === null) return;
    const res = await emit('investigate_player', { targetIndex: selectedPlayer });
    if (res?.success) {
      setInvestigateResult({ playerName: players[selectedPlayer].name, faction: res.faction });
      setSelectedPlayer(null);
      setTimeout(() => setInvestigateResult(null), 8000);
    }
  };

  const handleSpecialElection = async () => {
    if (selectedPlayer === null) return;
    const res = await emit('special_election', { targetIndex: selectedPlayer });
    if (res?.success) setSelectedPlayer(null);
  };

  const handlePeekAcknowledge = async () => {
    await emit('peek_acknowledge');
  };

  const handleUseAbility = async (abilityType, target) => {
    const res = await emit('use_ability', { abilityType, target });
    if (res && !res.error) {
      setAbilityResult(res);
      setTimeout(() => setAbilityResult(null), 8000);
    }
    return res;
  };

  // Determine clickable state for player selection
  const getPlayerClickable = (playerIndex) => {
    const p = players[playerIndex];
    if (!p.alive) return false;

    if (phase === 'nominate_minister' && isPresident) {
      if (playerIndex === presidentIndex) return false;
      if (playerIndex === gameState.lastMinisterIndex && players.filter(pp => pp.alive).length > 5) return false;
      if (playerIndex === gameState.lastPresidentIndex && players.filter(pp => pp.alive).length > 5) return false;
      return true;
    }
    if (phase === 'dual_nominate' && isPresident) {
      if (playerIndex === presidentIndex) return false;
      return true;
    }
    if (phase === 'execution' && isPresident) {
      return playerIndex !== presidentIndex;
    }
    if (phase === 'investigate' && isPresident) {
      return playerIndex !== presidentIndex;
    }
    if (phase === 'special_election' && isPresident) {
      return playerIndex !== presidentIndex;
    }
    return false;
  };

  // Pavel block check
  const canBlockExecution = phase === 'execution_block' &&
    me?.character?.ability === 'block_execution' && !me?.abilityUsed;

  return (
    <div className="container fade-in" style={{ paddingBottom: 100 }}>
      <Board gameState={gameState} />

      <PhaseInfo
        gameState={gameState}
        socketId={socketId}
        isPresident={isPresident}
        isMinister={isMinister}
      />

      {/* Vote Panel */}
      {phase === 'vote' && me?.alive && (
        <VotePanel
          gameState={gameState}
          socketId={socketId}
          onVote={handleVote}
          voteResult={voteResult}
        />
      )}

      {/* Policy Selection - President */}
      {phase === 'president_discard' && isPresident && privateState?.policies && (
        <PolicySelection
          policies={privateState.policies}
          onSelect={handleDiscard}
          title="Zahoď 1 zákon"
          subtitle="Vyber zákon který chceš zahodit. Zbylé 2 pošleš ministrovi."
        />
      )}

      {/* Policy Selection - Minister */}
      {phase === 'minister_discard' && isMinister && privateState?.policies && (
        <PolicySelection
          policies={privateState.policies}
          onSelect={handleDiscard}
          title="Přijmi 1 zákon"
          subtitle="Vyber zákon který chceš zahodit. Zbylý se přijme."
          vetoUnlocked={gameState.vetoUnlocked}
          onVeto={handleVetoRequest}
        />
      )}

      {/* Veto Request - President */}
      {phase === 'veto_request' && isPresident && (
        <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Ministr požaduje veto!</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-green btn-small" style={{ flex: 1 }} onClick={() => handleVetoResolve(true)}>
              Schválit veto
            </button>
            <button className="btn btn-danger btn-small" style={{ flex: 1 }} onClick={() => handleVetoResolve(false)}>
              Zamítnout
            </button>
          </div>
        </div>
      )}

      {/* Peek Policies - President */}
      {phase === 'peek_policies' && isPresident && privateState?.peekedPolicies && (
        <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Vrchní 3 karty v balíčku:</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {privateState.peekedPolicies.map((p, i) => (
              <div key={i} className={`policy-slot ${p.type === 'proRussian' ? 'filled-red' : 'filled-blue'}`}
                style={{ width: 80, height: 100, fontSize: 12, flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 20 }}>{p.type === 'proRussian' ? '🔴' : '🔵'}</span>
                <span style={{ fontSize: 10, padding: '0 4px', textAlign: 'center' }}>{p.name}</span>
              </div>
            ))}
          </div>
          <button className="btn btn-outline btn-small" onClick={handlePeekAcknowledge}>
            Rozumím
          </button>
        </div>
      )}

      {/* Execution */}
      {phase === 'execution' && isPresident && (
        <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>☠️ Vyber hráče k popravě</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Klikni na hráče a potvrď</p>
          {selectedPlayer !== null && (
            <button className="btn btn-danger btn-small" onClick={handleExecute}>
              Popravit {players[selectedPlayer]?.name}
            </button>
          )}
        </div>
      )}

      {/* Execution Block (Pavel) */}
      {phase === 'execution_block' && (
        <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
            ☠️ {players[presidentIndex]?.name} chce popravit {players[gameState.executionTarget]?.name}
          </p>
          {canBlockExecution ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-gold btn-small" style={{ flex: 1 }} onClick={() => handleBlockExecution(true)}>
                ⭐ Zablokovat popravu
              </button>
              <button className="btn btn-outline btn-small" style={{ flex: 1 }} onClick={() => handleBlockExecution(false)}>
                Nezasahovat
              </button>
            </div>
          ) : (
            <p className="pulse" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Čekání na Generála Pavla...</p>
          )}
        </div>
      )}

      {/* Investigate */}
      {phase === 'investigate' && isPresident && (
        <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🔍 Prošetři hráče</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Vyber hráče a zjisti jeho frakci</p>
          {selectedPlayer !== null && (
            <button className="btn btn-blue btn-small" onClick={handleInvestigate}>
              Prošetřit {players[selectedPlayer]?.name}
            </button>
          )}
        </div>
      )}

      {/* Investigate Result */}
      {investigateResult && (
        <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center', borderColor: investigateResult.faction === 'proRussian' ? 'var(--red)' : 'var(--blue)' }}>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🔍 Výsledek prošetření</p>
          <p style={{ fontSize: 14 }}>{investigateResult.playerName} je</p>
          <p style={{
            fontSize: 20, fontWeight: 900, marginTop: 8,
            color: investigateResult.faction === 'proRussian' ? 'var(--red)' : 'var(--blue)',
          }}>
            {investigateResult.faction === 'proRussian' ? '🔴 Proruský' : '🔵 Prozápadní'}
          </p>
        </div>
      )}

      {/* Special Election */}
      {phase === 'special_election' && isPresident && (
        <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🗳️ Zvláštní volby</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Vyber dalšího předsedu vlády</p>
          {selectedPlayer !== null && (
            <button className="btn btn-gold btn-small" onClick={handleSpecialElection}>
              Zvolit {players[selectedPlayer]?.name}
            </button>
          )}
        </div>
      )}

      {/* Nomination */}
      {phase === 'nominate_minister' && isPresident && (
        <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nominuj ministra</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Klikni na hráče</p>
          {selectedPlayer !== null && (
            <button className="btn btn-blue btn-small" onClick={handleNominate}>
              Nominovat {players[selectedPlayer]?.name}
            </button>
          )}
        </div>
      )}

      {/* Dual Nomination (Fiala) */}
      {phase === 'dual_nominate' && isPresident && (
        <DualNominatePanel
          players={players}
          presidentIndex={presidentIndex}
          selectedPlayer={selectedPlayer}
          setSelectedPlayer={setSelectedPlayer}
          onConfirm={handleDualNominate}
        />
      )}

      {/* Ability Result */}
      {abilityResult && (
        <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center', borderColor: 'var(--gold)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Výsledek schopnosti</p>
          {abilityResult.policy && (
            <p>Zahozený zákon: <span style={{ fontWeight: 700, color: abilityResult.policy.type === 'proRussian' ? 'var(--red)' : 'var(--blue)' }}>
              {abilityResult.policy.name} ({abilityResult.policy.type === 'proRussian' ? 'Proruský' : 'Prozápadní'})
            </span></p>
          )}
          {abilityResult.policies && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {abilityResult.policies.map((p, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: p.type === 'proRussian' ? 'var(--red-dim)' : 'var(--blue-dim)', fontSize: 12 }}>
                  {p.type === 'proRussian' ? '🔴' : '🔵'} {p.name}
                </div>
              ))}
            </div>
          )}
          {abilityResult.voteHistory && (
            <div>
              <p style={{ marginBottom: 8 }}>Historie hlasování: {abilityResult.targetName}</p>
              {abilityResult.voteHistory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Zatím žádné hlasy</p>
              ) : (
                abilityResult.voteHistory.map((v, i) => (
                  <span key={i} style={{ margin: '0 4px', color: v.vote === 'yes' ? 'var(--green)' : 'var(--danger)' }}>
                    Kolo {v.round}: {v.vote === 'yes' ? 'ANO' : 'NE'}
                  </span>
                ))
              )}
            </div>
          )}
          {abilityResult.success && !abilityResult.policy && !abilityResult.policies && !abilityResult.voteHistory && (
            <p style={{ color: 'var(--green)' }}>Schopnost úspěšně použita!</p>
          )}
        </div>
      )}

      {/* Player Grid */}
      <PlayerList
        players={players}
        presidentIndex={presidentIndex}
        ministerIndex={ministerIndex}
        nominatedMinisterIndex={nominatedMinisterIndex}
        socketId={socketId}
        selectedPlayer={selectedPlayer}
        onPlayerClick={(i) => {
          if (getPlayerClickable(i)) {
            setSelectedPlayer(i === selectedPlayer ? null : i);
          }
        }}
        getPlayerClickable={getPlayerClickable}
        votes={gameState.votes}
        phase={phase}
      />

      {/* Ability Button */}
      {me?.alive && !me?.abilityUsed && me?.character && (
        <AbilityButton
          character={me.character}
          gameState={gameState}
          socketId={socketId}
          onUseAbility={handleUseAbility}
          players={players}
        />
      )}

      <GameLog log={gameState.log} />

      {error && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--danger)', color: 'white', padding: '10px 20px',
          borderRadius: 8, fontSize: 14, zIndex: 100,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

function DualNominatePanel({ players, presidentIndex, selectedPlayer, setSelectedPlayer, onConfirm }) {
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);

  const handleSelect = (i) => {
    if (!players[i].alive || i === presidentIndex) return;
    if (first === null) {
      setFirst(i);
    } else if (second === null && i !== first) {
      setSecond(i);
      setSelectedPlayer({ first, second: i });
    } else {
      setFirst(i);
      setSecond(null);
      setSelectedPlayer(null);
    }
  };

  return (
    <div className="card slide-up" style={{ marginBottom: 16, textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🤝 Fialova schopnost</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Vyber 2 kandidáty na ministra</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        {players.map((p, i) => {
          if (!p.alive || i === presidentIndex) return null;
          const selected = i === first || i === second;
          return (
            <button key={i} className={`btn btn-small ${selected ? 'btn-blue' : 'btn-outline'}`}
              style={{ flex: '0 0 auto' }} onClick={() => handleSelect(i)}>
              {p.character.emoji} {p.name}
            </button>
          );
        })}
      </div>
      {first !== null && second !== null && (
        <button className="btn btn-blue btn-small" onClick={onConfirm}>
          Nominovat {players[first].name} a {players[second].name}
        </button>
      )}
    </div>
  );
}
