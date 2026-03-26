import { useState, useCallback } from 'react';

const POLICY_NAMES = {
  pro_west: 'Prozápadní',
  pro_russian: 'Proruský',
};

function GameBoard({ gameState, playerId, socket, abilityResult, setAbilityResult }) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [fialaCand1, setFialaCand1] = useState(null);
  const [fialaCand2, setFialaCand2] = useState(null);

  const gs = gameState;
  const me = gs.players.find(p => p.id === playerId);
  const president = gs.players.find(p => p.id === gs.presidentId);
  const minister = gs.players.find(p => p.id === gs.ministerId);
  const nominated = gs.players.find(p => p.id === gs.nominatedMinisterId);
  const isPresident = gs.presidentId === playerId;
  const isMinister = gs.ministerId === playerId;
  const isNominatedMinister = gs.nominatedMinisterId === playerId;

  const emit = useCallback((event, data, cb) => {
    socket.emit(event, data, (res) => {
      if (res?.error) {
        alert(res.error);
      }
      if (cb) cb(res);
    });
  }, [socket]);

  const handleNominate = useCallback((targetId) => {
    // Check if president is Fiala with unused ability
    const presChar = president?.character;
    if (presChar?.id === 'fiala' && !me?.abilityUsed && isPresident) {
      // Fiala mode - need 2 candidates
      if (!fialaCand1) {
        setFialaCand1(targetId);
        return;
      }
      if (targetId === fialaCand1) {
        setFialaCand1(null);
        return;
      }
      emit('fiala_nominate', { candidate1Id: fialaCand1, candidate2Id: targetId });
      setFialaCand1(null);
      return;
    }

    emit('nominate_minister', { targetId });
  }, [emit, president, me, isPresident, fialaCand1]);

  const handleVote = useCallback((vote) => {
    emit('vote', { vote });
  }, [emit]);

  const handleFialaVote = useCallback((candidateId) => {
    emit('fiala_vote', { candidateId });
  }, [emit]);

  const handlePresidentDiscard = useCallback((index) => {
    emit('president_discard', { discardIndex: index });
  }, [emit]);

  const handleMinisterDiscard = useCallback((index) => {
    emit('minister_discard', { discardIndex: index });
  }, [emit]);

  const handleVetoRequest = useCallback(() => {
    emit('veto_request', {});
  }, [emit]);

  const handleVetoResponse = useCallback((approve) => {
    emit('veto_response', { approve });
  }, [emit]);

  const handleExecutiveAction = useCallback((action, targetId) => {
    emit('executive_action', { action, targetId }, (res) => {
      if (res?.result) {
        setAbilityResult(res.result);
      }
    });
  }, [emit, setAbilityResult]);

  const handleUseAbility = useCallback((targetId) => {
    emit('use_ability', { targetId }, (res) => {
      if (res?.result) {
        setAbilityResult(res.result);
      }
    });
    setSelectedTarget(null);
  }, [emit, setAbilityResult]);

  // Determine if ability needs a target
  const abilityNeedsTarget = (charId) => {
    return ['pavel', 'rakusan'].includes(charId);
  };

  const canUseAbilityNow = (charId, phase) => {
    switch (charId) {
      case 'schillerova': return phase === 'minister_discard' || phase === 'policy_enacted' || phase === 'executive_action';
      case 'havlicek': return phase === 'minister_discard' || phase === 'policy_enacted' || phase === 'executive_action' || phase === 'nominate_minister';
      case 'turek': return phase === 'voting' || phase === 'nominate_minister';
      case 'macinka': return true;
      case 'klaus': return phase === 'nominate_minister';
      case 'fiala': return false; // handled automatically
      case 'pavel': return true;
      case 'okamura': return phase === 'nominate_minister';
      case 'bartos': return phase === 'voting';
      case 'nerudova': return phase === 'nominate_minister' || phase === 'voting';
      case 'lipavsky': return true;
      case 'rakusan': return true;
      default: return false;
    }
  };

  const renderPolicyBoard = () => (
    <div className="policy-board">
      <div className="policy-track">
        <span className="policy-track-label pro-west">Prozápadní</span>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`policy-slot ${i <= gs.proWestPolicies ? 'filled pro_west' : ''}`}>
            {i <= gs.proWestPolicies ? gs.enactedLawNames.filter(l => l.type === 'pro_west')[i-1]?.name?.split(' ').slice(0, 2).join(' ') || '✓' : ''}
          </div>
        ))}
      </div>
      <div className="policy-track">
        <span className="policy-track-label pro-russian">Proruský</span>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={`policy-slot ${i <= gs.proRussianPolicies ? 'filled pro_russian' : ''}`}>
            {i <= gs.proRussianPolicies ? gs.enactedLawNames.filter(l => l.type === 'pro_russian')[i-1]?.name?.split(' ').slice(0, 2).join(' ') || '✓' : ''}
          </div>
        ))}
      </div>
      <div className="fail-counter">
        <span className="fail-counter-label">Neúspěšné vlády:</span>
        {[1, 2, 3].map(i => (
          <div key={i} className={`fail-dot ${i <= gs.failCounter ? 'active' : ''}`}>
            {i <= gs.failCounter ? '!' : i}
          </div>
        ))}
      </div>
      <div className="deck-info">Zbývá karet v balíčku: {gs.deckCount}</div>
    </div>
  );

  const renderGovernment = () => (
    <div className="government-info">
      <div className="gov-role">
        <div className="gov-role-label">Premiér</div>
        <div className="gov-role-name" style={{ color: 'var(--gold)' }}>
          {president?.name || '—'}
        </div>
      </div>
      <div className="gov-role">
        <div className="gov-role-label">Kolo</div>
        <div className="gov-role-name">{gs.round}</div>
      </div>
      <div className="gov-role">
        <div className="gov-role-label">Ministr</div>
        <div className="gov-role-name" style={{ color: 'var(--green)' }}>
          {minister?.name || nominated?.name || '—'}
        </div>
      </div>
    </div>
  );

  const renderPhaseAction = () => {
    switch (gs.phase) {
      case 'nominate_minister': {
        if (!isPresident) {
          return (
            <div className="phase-banner">
              <div className="phase-title">Nominace ministra</div>
              <div className="phase-description">
                {president?.name} vybírá kandidáta na ministra...
              </div>
            </div>
          );
        }

        const isFiala = me?.character?.id === 'fiala' && !me?.abilityUsed;

        return (
          <div className="action-area">
            <div className="phase-banner">
              <div className="phase-title">
                {isFiala ? 'Nominuj 2 kandidáty' : 'Nominuj ministra'}
              </div>
              <div className="phase-description">
                {isFiala
                  ? `Vyber 2 kandidáty, hráči rozhodnou${fialaCand1 ? ' (vyber druhého)' : ''}`
                  : 'Vyber hráče jako kandidáta na ministra'}
              </div>
            </div>
            <div className="player-select-grid">
              {gs.players.filter(p => p.alive && p.id !== playerId).map(p => {
                const canNominate = p.id !== gs.presidentId &&
                  !(gs.previousMinisterIndex !== null && gs.players[gs.previousMinisterIndex]?.id === p.id) &&
                  !(gs.players.filter(pl => pl.alive).length > 5 && gs.previousPresidentIndex !== null && gs.players[gs.previousPresidentIndex]?.id === p.id);

                return (
                  <button
                    key={p.id}
                    className={`player-select-btn ${fialaCand1 === p.id ? 'selected' : ''}`}
                    onClick={() => handleNominate(p.id)}
                    disabled={!canNominate}
                  >
                    <div>{p.name}</div>
                    <div className="char-name">{p.character.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'fiala_vote': {
        if (isPresident) {
          return (
            <div className="phase-banner">
              <div className="phase-title">Hlasování o kandidátech</div>
              <div className="phase-description">Hráči vybírají mezi tvými kandidáty...</div>
            </div>
          );
        }

        const alreadyVoted = gs.votes && gs.votes[playerId];

        if (alreadyVoted) {
          return (
            <div className="phase-banner">
              <div className="phase-title">Hlasování o kandidátech</div>
              <div className="phase-description">Čekání na ostatní hráče...</div>
            </div>
          );
        }

        return (
          <div className="action-area">
            <div className="phase-banner">
              <div className="phase-title">Vyber kandidáta na ministra</div>
            </div>
            <div className="vote-buttons">
              {gs.fialaCandidates?.map(cId => {
                const cand = gs.players.find(p => p.id === cId);
                return (
                  <button
                    key={cId}
                    className="btn btn-primary"
                    onClick={() => handleFialaVote(cId)}
                  >
                    {cand?.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'voting': {
        const alreadyVoted = gs.votes && gs.votes[playerId] !== undefined;
        const myBartosSkip = gs.myBartosSkipNextVote;

        if (myBartosSkip) {
          return (
            <div className="phase-banner">
              <div className="phase-title">Hlasování</div>
              <div className="phase-description">
                Tvůj hlas je přeskočen (efekt Bartoše)
              </div>
            </div>
          );
        }

        if (alreadyVoted) {
          return (
            <div className="phase-banner">
              <div className="phase-title">Hlasování probíhá</div>
              <div className="phase-description">Čekání na ostatní hráče...</div>
              {gs.votes._revealed && renderVotes()}
            </div>
          );
        }

        return (
          <div className="action-area">
            <div className="phase-banner">
              <div className="phase-title">Hlasování o vládě</div>
              <div className="phase-description">
                Premiér: {president?.name} / Ministr: {nominated?.name}
              </div>
            </div>
            <div className="vote-buttons">
              <button className="btn btn-success" onClick={() => handleVote('ja')}>
                ANO
              </button>
              <button className="btn btn-danger" onClick={() => handleVote('ne')}>
                NE
              </button>
            </div>
          </div>
        );
      }

      case 'president_discard': {
        if (!isPresident) {
          return (
            <div className="phase-banner">
              <div className="phase-title">Legislativa</div>
              <div className="phase-description">
                {president?.name} vybírá zákony...
              </div>
            </div>
          );
        }

        return (
          <div className="action-area">
            <div className="phase-banner">
              <div className="phase-title">Zahoď 1 zákon</div>
              <div className="phase-description">
                Vyber zákon k zahození. Zbylé 2 pošleš ministrovi.
              </div>
            </div>
            <div className="policy-cards">
              {gs.drawnPolicies?.map((policy, i) => (
                <div
                  key={i}
                  className={`policy-card ${policy}`}
                  onClick={() => handlePresidentDiscard(i)}
                >
                  <div>{POLICY_NAMES[policy]}</div>
                  <div className="policy-label">Klikni pro zahození</div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'minister_discard': {
        if (!isMinister) {
          return (
            <div className="phase-banner">
              <div className="phase-title">Legislativa</div>
              <div className="phase-description">
                {minister?.name} vybírá zákon k přijetí...
              </div>
            </div>
          );
        }

        return (
          <div className="action-area">
            <div className="phase-banner">
              <div className="phase-title">Zahoď 1 zákon</div>
              <div className="phase-description">
                Vyber zákon k zahození. Zbývající bude přijat.
                {gs.vetoUnlocked && ' Můžeš také navrhnout veto.'}
              </div>
            </div>
            <div className="policy-cards">
              {gs.ministerPolicies?.map((policy, i) => (
                <div
                  key={i}
                  className={`policy-card ${policy}`}
                  onClick={() => handleMinisterDiscard(i)}
                >
                  <div>{POLICY_NAMES[policy]}</div>
                  <div className="policy-label">Klikni pro zahození</div>
                </div>
              ))}
            </div>
            {gs.vetoUnlocked && (
              <button className="btn btn-gold" onClick={handleVetoRequest}>
                Navrhnout veto
              </button>
            )}
          </div>
        );
      }

      case 'veto_request': {
        if (isPresident) {
          return (
            <div className="action-area">
              <div className="phase-banner">
                <div className="phase-title">Ministr navrhuje veto!</div>
                <div className="phase-description">Schválíš veto? Oba zákony budou zahozeny.</div>
              </div>
              <div className="veto-area">
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleVetoResponse(true)}>
                  Schválit veto
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleVetoResponse(false)}>
                  Zamítnout veto
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="phase-banner">
            <div className="phase-title">Veto navrženo!</div>
            <div className="phase-description">
              Premiér {president?.name} rozhoduje o schválení veta...
            </div>
          </div>
        );
      }

      case 'executive_action': {
        const action = gs.pendingAbility;
        if (!isPresident) {
          return (
            <div className="phase-banner">
              <div className="phase-title">Speciální akce premiéra</div>
              <div className="phase-description">
                {president?.name} provádí speciální akci...
              </div>
            </div>
          );
        }

        switch (action?.type) {
          case 'peek':
            return (
              <div className="action-area">
                <div className="phase-banner">
                  <div className="phase-title">Nahlédnutí na zákony</div>
                  <div className="phase-description">Klikni pro nahlédnutí na 3 zákony na vrcholu balíčku</div>
                </div>
                <button className="btn btn-primary" onClick={() => handleExecutiveAction('peek')}>
                  Nahlédnout
                </button>
              </div>
            );

          case 'investigate':
            return (
              <div className="action-area">
                <div className="phase-banner">
                  <div className="phase-title">Prošetření hráče</div>
                  <div className="phase-description">Vyber hráče k prošetření - zjistíš jeho frakci</div>
                </div>
                <div className="player-select-grid">
                  {gs.players.filter(p => p.alive && p.id !== playerId && !p.investigated).map(p => (
                    <button
                      key={p.id}
                      className="player-select-btn"
                      onClick={() => handleExecutiveAction('investigate', p.id)}
                    >
                      <div>{p.name}</div>
                      <div className="char-name">{p.character.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            );

          case 'special_election':
            return (
              <div className="action-area">
                <div className="phase-banner">
                  <div className="phase-title">Zvláštní volby</div>
                  <div className="phase-description">Vyber příštího premiéra</div>
                </div>
                <div className="player-select-grid">
                  {gs.players.filter(p => p.alive && p.id !== playerId).map(p => (
                    <button
                      key={p.id}
                      className="player-select-btn"
                      onClick={() => handleExecutiveAction('special_election', p.id)}
                    >
                      <div>{p.name}</div>
                      <div className="char-name">{p.character.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            );

          case 'execution':
            return (
              <div className="action-area">
                <div className="phase-banner">
                  <div className="phase-title">Poprava</div>
                  <div className="phase-description">Vyber hráče k popravení</div>
                </div>
                <div className="player-select-grid">
                  {gs.players.filter(p => p.alive && p.id !== playerId).map(p => (
                    <button
                      key={p.id}
                      className="player-select-btn"
                      onClick={() => handleExecutiveAction('execution', p.id)}
                    >
                      <div>{p.name}</div>
                      <div className="char-name">{p.character.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            );

          default:
            return null;
        }
      }

      default:
        return (
          <div className="phase-banner">
            <div className="phase-title">Čekání...</div>
          </div>
        );
    }
  };

  const renderVotes = () => {
    if (!gs.votes?._revealed) return null;
    return (
      <div className="votes-display" style={{ marginTop: '8px' }}>
        {Object.entries(gs.votes).filter(([k]) => k !== '_revealed').map(([pid, v]) => {
          const p = gs.players.find(pl => pl.id === pid);
          return (
            <span key={pid} className={`vote-chip ${v || 'abstain'}`}>
              {p?.name}: {v === 'ja' ? 'ANO' : v === 'ne' ? 'NE' : 'Abstain'}
            </span>
          );
        })}
      </div>
    );
  };

  const renderPlayersOverview = () => (
    <div className="players-overview">
      {gs.players.map(p => (
        <div
          key={p.id}
          className={`player-card-mini ${!p.alive ? 'dead' : ''} ${p.id === gs.presidentId ? 'is-president' : ''} ${p.id === gs.ministerId ? 'is-minister' : ''}`}
        >
          {p.id === gs.presidentId && <span className="mini-role-icon president">P</span>}
          {p.id === gs.ministerId && <span className="mini-role-icon minister">M</span>}
          <div className="mini-name">{p.name}</div>
          <div className="mini-char">{p.character.name}</div>
          {p.alive && !p.abilityUsed && p.character.id !== 'fiala' && (
            <div className="ability-available">Schopnost k dispozici</div>
          )}
        </div>
      ))}
    </div>
  );

  const renderAbilityBar = () => {
    if (!me?.alive || me.abilityUsed || me.character.id === 'fiala') return null;
    const charId = me.character.id;
    const canUse = canUseAbilityNow(charId, gs.phase);

    if (!canUse) return null;

    const needsTarget = abilityNeedsTarget(charId);

    return (
      <div className="my-ability-bar">
        <div>
          <div className="my-ability-name">{me.character.name}</div>
          <div className="my-ability-desc">{me.character.ability}</div>
        </div>
        {needsTarget ? (
          <button
            className="btn btn-gold btn-sm"
            onClick={() => setSelectedTarget('choosing')}
          >
            Použít
          </button>
        ) : (
          <button
            className="btn btn-gold btn-sm"
            onClick={() => handleUseAbility(null)}
          >
            Použít
          </button>
        )}
      </div>
    );
  };

  const renderAbilityTargetModal = () => {
    if (selectedTarget !== 'choosing') return null;

    return (
      <div className="ability-modal" onClick={() => setSelectedTarget(null)}>
        <div className="ability-modal-content" onClick={e => e.stopPropagation()}>
          <h3>Vyber cíl schopnosti</h3>
          <p>{me.character.ability}</p>
          <div className="player-select-grid">
            {gs.players.filter(p => p.alive && p.id !== playerId).map(p => (
              <button
                key={p.id}
                className="player-select-btn"
                onClick={() => {
                  handleUseAbility(p.id);
                  setSelectedTarget(null);
                }}
              >
                <div>{p.name}</div>
              </button>
            ))}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '12px' }}
            onClick={() => setSelectedTarget(null)}
          >
            Zrušit
          </button>
        </div>
      </div>
    );
  };

  const renderAbilityResultModal = () => {
    if (!abilityResult) return null;

    return (
      <div className="ability-modal" onClick={() => setAbilityResult(null)}>
        <div className="ability-modal-content" onClick={e => e.stopPropagation()}>
          <h3>Výsledek</h3>
          {abilityResult.topCards && (
            <div>
              <p>Karty na vrcholu balíčku:</p>
              <div className="policy-cards" style={{ marginTop: '12px' }}>
                {abilityResult.topCards.map((c, i) => (
                  <div key={i} className={`policy-card ${c}`} style={{ cursor: 'default', width: '80px', height: '100px' }}>
                    {POLICY_NAMES[c]}
                  </div>
                ))}
              </div>
            </div>
          )}
          {abilityResult.faction && (
            <p>
              Frakce hráče:{' '}
              <span className={`faction-badge ${abilityResult.faction}`}>
                {abilityResult.faction === 'pro_west' ? 'PROZÁPADNÍ' : 'PRORUSKÝ'}
              </span>
            </p>
          )}
          {abilityResult.discardedPolicy && (
            <p>
              Zahozený zákon:{' '}
              <span className={`faction-badge ${abilityResult.discardedPolicy}`}>
                {POLICY_NAMES[abilityResult.discardedPolicy]}
              </span>
            </p>
          )}
          {abilityResult.discardedPolicies && (
            <div>
              <p>Zahozené karty z posledního kola:</p>
              <div className="policy-cards" style={{ marginTop: '12px' }}>
                {abilityResult.discardedPolicies.map((c, i) => (
                  <div key={i} className={`policy-card ${c}`} style={{ cursor: 'default', width: '80px', height: '100px' }}>
                    {POLICY_NAMES[c]}
                  </div>
                ))}
              </div>
            </div>
          )}
          {abilityResult.voteHistory && (
            <div>
              <p>Historie hlasování - {abilityResult.targetName}:</p>
              <div style={{ marginTop: '8px' }}>
                {abilityResult.voteHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Zatím nehlasoval/a</p>
                ) : (
                  abilityResult.voteHistory.map((v, i) => (
                    <span key={i} className={`vote-chip ${v.vote}`} style={{ margin: '2px' }}>
                      Kolo {v.round}: {v.vote === 'ja' ? 'ANO' : v.vote === 'ne' ? 'NE' : 'Abstain'}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
          {abilityResult.blocked && (
            <p>Poprava hráče {abilityResult.targetName} byla zablokována Generálem Pavlem!</p>
          )}
          {abilityResult.executed && (
            <p>Hráč {abilityResult.executed} byl popraven.</p>
          )}
          <button
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={() => setAbilityResult(null)}
          >
            Rozumím
          </button>
        </div>
      </div>
    );
  };

  const renderGameLog = () => (
    <div className="game-log">
      <h4>Herní log</h4>
      {[...gs.log].reverse().map((entry, i) => (
        <div key={i} className="log-entry">{entry}</div>
      ))}
    </div>
  );

  return (
    <div className="screen game-screen">
      {renderPolicyBoard()}
      {renderGovernment()}
      {renderPhaseAction()}
      {gs.votes?._revealed && renderVotes()}
      {renderPlayersOverview()}
      {renderGameLog()}
      {renderAbilityBar()}
      {renderAbilityTargetModal()}
      {renderAbilityResultModal()}
    </div>
  );
}

export default GameBoard;
