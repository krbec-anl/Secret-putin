import { useState, useCallback } from 'react';

const POLICY_NAMES = {
  pro_west: 'Prozápadní',
  pro_russian: 'Proruský',
};

const POLICY_EMOJIS = {
  pro_west: '🇪🇺',
  pro_russian: '☭',
};

const CHARACTER_EMOJIS = {
  schillerova: '💰', havlicek: '🔄', turek: '🚫', macinka: '🔮',
  klaus: '🏛️', fiala: '🤝', pavel: '🛡️', okamura: '👆',
  bartos: '💻', nerudova: '📊', lipavsky: '🕊️', rakusan: '🔍',
};

function GameBoard({ gameState, playerId, socket, abilityResult, setAbilityResult }) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [fialaCand1, setFialaCand1] = useState(null);

  const gs = gameState;
  const me = gs.players.find(p => p.id === playerId);
  const president = gs.players.find(p => p.id === gs.presidentId);
  const minister = gs.players.find(p => p.id === gs.ministerId);
  const nominated = gs.players.find(p => p.id === gs.nominatedMinisterId);
  const isPresident = gs.presidentId === playerId;
  const isMinister = gs.ministerId === playerId;

  const emit = useCallback((event, data, cb) => {
    socket.emit(event, data, (res) => {
      if (res?.error) alert(res.error);
      if (cb) cb(res);
    });
  }, [socket]);

  const handleNominate = useCallback((targetId) => {
    const presChar = president?.character;
    if (presChar?.id === 'fiala' && !me?.abilityUsed && isPresident) {
      if (!fialaCand1) { setFialaCand1(targetId); return; }
      if (targetId === fialaCand1) { setFialaCand1(null); return; }
      emit('fiala_nominate', { candidate1Id: fialaCand1, candidate2Id: targetId });
      setFialaCand1(null);
      return;
    }
    emit('nominate_minister', { targetId });
  }, [emit, president, me, isPresident, fialaCand1]);

  const handleVote = useCallback((vote) => emit('vote', { vote }), [emit]);
  const handleFialaVote = useCallback((candidateId) => emit('fiala_vote', { candidateId }), [emit]);
  const handlePresidentDiscard = useCallback((index) => emit('president_discard', { discardIndex: index }), [emit]);
  const handleMinisterDiscard = useCallback((index) => emit('minister_discard', { discardIndex: index }), [emit]);
  const handleVetoRequest = useCallback(() => emit('veto_request', {}), [emit]);
  const handleVetoResponse = useCallback((approve) => emit('veto_response', { approve }), [emit]);

  const handleExecutiveAction = useCallback((action, targetId) => {
    emit('executive_action', { action, targetId }, (res) => {
      if (res?.result) setAbilityResult(res.result);
    });
  }, [emit, setAbilityResult]);

  const handleUseAbility = useCallback((targetId) => {
    emit('use_ability', { targetId }, (res) => {
      if (res?.result) setAbilityResult(res.result);
    });
    setSelectedTarget(null);
  }, [emit, setAbilityResult]);

  const abilityNeedsTarget = (charId) => ['pavel', 'rakusan'].includes(charId);

  const canUseAbilityNow = (charId, phase) => {
    switch (charId) {
      case 'schillerova': return phase === 'minister_discard' || phase === 'policy_enacted' || phase === 'executive_action';
      case 'havlicek': return phase === 'minister_discard' || phase === 'policy_enacted' || phase === 'executive_action' || phase === 'nominate_minister';
      case 'turek': return phase === 'voting' || phase === 'nominate_minister';
      case 'macinka': return true;
      case 'klaus': return phase === 'nominate_minister';
      case 'fiala': return false;
      case 'pavel': return true;
      case 'okamura': return phase === 'nominate_minister';
      case 'bartos': return phase === 'voting';
      case 'nerudova': return phase === 'nominate_minister' || phase === 'voting';
      case 'lipavsky': return true;
      case 'rakusan': return true;
      default: return false;
    }
  };

  const getCharEmoji = (charId) => CHARACTER_EMOJIS[charId] || '🎭';

  const renderPolicyBoard = () => (
    <div className="policy-board">
      <div className="policy-track-section">
        <div className="policy-track-header pro-west">🇪🇺 Prozápadní ({gs.proWestPolicies}/5)</div>
        <div className="policy-track">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`policy-slot ${i <= gs.proWestPolicies ? 'filled pro_west' : 'empty-west'}`}>
              {i <= gs.proWestPolicies ? '🇪🇺' : ''}
            </div>
          ))}
        </div>
      </div>
      <div className="policy-track-section">
        <div className="policy-track-header pro-russian">☭ Proruský ({gs.proRussianPolicies}/6)</div>
        <div className="policy-track">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`policy-slot ${i <= gs.proRussianPolicies ? 'filled pro_russian' : 'empty-russian'}`}>
              {i <= gs.proRussianPolicies ? '☭' : ''}
            </div>
          ))}
        </div>
      </div>
      <div className="board-meta">
        <div className="fail-counter">
          <span className="fail-counter-label">Neúspěšné vlády:</span>
          {[1, 2, 3].map(i => (
            <div key={i} className={`fail-dot ${i <= gs.failCounter ? 'active' : ''}`}>
              {i <= gs.failCounter ? '⚠️' : i}
            </div>
          ))}
        </div>
        <div className="deck-info">🃏 {gs.deckCount} karet</div>
      </div>
    </div>
  );

  const renderGovernment = () => (
    <div className="government-info">
      <div className="gov-role">
        <div className="gov-role-label">👑 Premiér</div>
        <div className="gov-role-name president-name">
          {president?.name || '—'}
        </div>
        {president && <div className="gov-role-char">{getCharEmoji(president.character.id)} {president.character.name}</div>}
      </div>
      <div className="gov-role gov-round">
        <div className="gov-role-label">Kolo</div>
        <div className="round-number">{gs.round}</div>
      </div>
      <div className="gov-role">
        <div className="gov-role-label">🏛️ Ministr</div>
        <div className="gov-role-name minister-name">
          {minister?.name || nominated?.name || '—'}
        </div>
        {(minister || nominated) && (
          <div className="gov-role-char">
            {getCharEmoji((minister || nominated).character.id)} {(minister || nominated).character.name}
          </div>
        )}
      </div>
    </div>
  );

  const renderPhaseAction = () => {
    switch (gs.phase) {
      case 'role_reveal':
        return (
          <div className="phase-banner phase-waiting">
            <div className="phase-icon">⏳</div>
            <div className="phase-title">Čekání na ostatní hráče</div>
            <div className="phase-description">
              Až všichni potvrdí svou roli, hra automaticky začne. Čekej prosím...
            </div>
          </div>
        );

      case 'nominate_minister': {
        if (!isPresident) {
          return (
            <div className="phase-banner phase-waiting">
              <div className="phase-icon">👑</div>
              <div className="phase-title">Čekej — probíhá nominace</div>
              <div className="phase-description">
                Premiér {president?.name} právě vybírá kandidáta na ministra. Poté budete hlasovat.
              </div>
            </div>
          );
        }

        const isFiala = me?.character?.id === 'fiala' && !me?.abilityUsed;

        return (
          <div className="action-area">
            <div className="phase-banner phase-active">
              <div className="phase-icon">👑</div>
              <div className="phase-title">
                {gs.round === 1 ? 'Začni hru! ' : ''}
                {isFiala ? 'Nominuj 2 kandidáty' : 'Nominuj ministra'}
              </div>
              <div className="phase-description">
                {gs.round === 1
                  ? 'Jsi první premiér! Klikni na hráče níže, kterého chceš nominovat za ministra. Ostatní o něm budou hlasovat.'
                  : isFiala
                    ? `Klikni na 2 různé hráče jako kandidáty.${fialaCand1 ? ' Vyber druhého kandidáta.' : ''} Ostatní pak vyberou jednoho z nich.`
                    : 'Klikni na hráče kterého chceš nominovat za ministra. Ostatní o něm budou hlasovat.'}
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
                    <div className="select-emoji">{getCharEmoji(p.character.id)}</div>
                    <div className="select-name">{p.name}</div>
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
            <div className="phase-banner phase-waiting">
              <div className="phase-icon">🤝</div>
              <div className="phase-title">Hlasování o kandidátech</div>
              <div className="phase-description">Hráči vybírají mezi tvými kandidáty...</div>
            </div>
          );
        }

        const alreadyVoted = gs.votes && gs.votes[playerId];

        if (alreadyVoted) {
          return (
            <div className="phase-banner phase-waiting">
              <div className="phase-icon">⏳</div>
              <div className="phase-title">Hlasování o kandidátech</div>
              <div className="phase-description">Čekání na ostatní hráče...</div>
            </div>
          );
        }

        return (
          <div className="action-area">
            <div className="phase-banner phase-active">
              <div className="phase-icon">🗳️</div>
              <div className="phase-title">Vyber kandidáta na ministra</div>
            </div>
            <div className="vote-buttons">
              {gs.fialaCandidates?.map(cId => {
                const cand = gs.players.find(p => p.id === cId);
                return (
                  <button key={cId} className="btn btn-primary btn-glow" onClick={() => handleFialaVote(cId)}>
                    {getCharEmoji(cand?.character?.id)} {cand?.name}
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
            <div className="phase-banner phase-waiting">
              <div className="phase-icon">💻</div>
              <div className="phase-title">Hlasování</div>
              <div className="phase-description">
                Tvůj hlas je přeskočen (efekt Bartoše)
              </div>
            </div>
          );
        }

        if (alreadyVoted) {
          return (
            <div className="phase-banner phase-waiting">
              <div className="phase-icon">⏳</div>
              <div className="phase-title">Hlasování probíhá</div>
              <div className="phase-description">Čekání na ostatní hráče...</div>
              {gs.votes._revealed && renderVotes()}
            </div>
          );
        }

        return (
          <div className="action-area">
            <div className="phase-banner phase-active">
              <div className="phase-icon">🗳️</div>
              <div className="phase-title">Hlasuj ANO nebo NE</div>
              <div className="phase-description">
                Chceš vládu 👑 {president?.name} + 🏛️ {nominated?.name}? Klikni na ANO nebo NE.
              </div>
            </div>
            <div className="vote-buttons">
              <button className="btn btn-vote-yes" onClick={() => handleVote('ja')}>
                ✅ ANO
              </button>
              <button className="btn btn-vote-no" onClick={() => handleVote('ne')}>
                ❌ NE
              </button>
            </div>
          </div>
        );
      }

      case 'president_discard': {
        if (!isPresident) {
          return (
            <div className="phase-banner phase-waiting">
              <div className="phase-icon">📜</div>
              <div className="phase-title">Čekej — premiér vybírá zákony</div>
              <div className="phase-description">
                Premiér {president?.name} dostal 3 zákony a zahodí jeden. Zbylé 2 pošle ministrovi.
              </div>
            </div>
          );
        }

        return (
          <div className="action-area">
            <div className="phase-banner phase-active">
              <div className="phase-icon">📜</div>
              <div className="phase-title">Zahoď 1 zákon</div>
              <div className="phase-description">
                Dostal jsi 3 zákony. Klikni na ten, který chceš zahodit. Zbylé 2 dostane ministr.
              </div>
            </div>
            <div className="policy-cards">
              {gs.drawnPolicies?.map((policy, i) => (
                <div
                  key={i}
                  className={`policy-card ${policy}`}
                  onClick={() => handlePresidentDiscard(i)}
                >
                  <div className="policy-card-emoji">{POLICY_EMOJIS[policy]}</div>
                  <div className="policy-card-name">{POLICY_NAMES[policy]}</div>
                  <div className="policy-label">Zahodit</div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'minister_discard': {
        if (!isMinister) {
          return (
            <div className="phase-banner phase-waiting">
              <div className="phase-icon">📜</div>
              <div className="phase-title">Čekej — ministr vybírá zákon</div>
              <div className="phase-description">
                Ministr {minister?.name} dostal 2 zákony od premiéra. Jeden zahodí, druhý bude přijat.
              </div>
            </div>
          );
        }

        return (
          <div className="action-area">
            <div className="phase-banner phase-active">
              <div className="phase-icon">📜</div>
              <div className="phase-title">Zahoď 1 zákon</div>
              <div className="phase-description">
                Dostal jsi 2 zákony od premiéra. Klikni na ten, který chceš zahodit. Druhý bude přijat!
                {gs.vetoUnlocked && ' Nebo můžeš navrhnout veto (zahodí oba).'}
              </div>
            </div>
            <div className="policy-cards">
              {gs.ministerPolicies?.map((policy, i) => (
                <div
                  key={i}
                  className={`policy-card ${policy}`}
                  onClick={() => handleMinisterDiscard(i)}
                >
                  <div className="policy-card-emoji">{POLICY_EMOJIS[policy]}</div>
                  <div className="policy-card-name">{POLICY_NAMES[policy]}</div>
                  <div className="policy-label">Zahodit</div>
                </div>
              ))}
            </div>
            {gs.vetoUnlocked && (
              <button className="btn btn-gold btn-glow" onClick={handleVetoRequest}>
                ✋ Navrhnout veto
              </button>
            )}
          </div>
        );
      }

      case 'veto_request': {
        if (isPresident) {
          return (
            <div className="action-area">
              <div className="phase-banner phase-active phase-danger">
                <div className="phase-icon">✋</div>
                <div className="phase-title">Ministr navrhuje veto!</div>
                <div className="phase-description">Schválíš veto? Oba zákony budou zahozeny.</div>
              </div>
              <div className="veto-area">
                <button className="btn btn-vote-yes" style={{ flex: 1 }} onClick={() => handleVetoResponse(true)}>
                  ✅ Schválit
                </button>
                <button className="btn btn-vote-no" style={{ flex: 1 }} onClick={() => handleVetoResponse(false)}>
                  ❌ Zamítnout
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="phase-banner phase-waiting">
            <div className="phase-icon">✋</div>
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
            <div className="phase-banner phase-waiting">
              <div className="phase-icon">⚡</div>
              <div className="phase-title">Speciální akce premiéra</div>
              <div className="phase-description">
                {president?.name} provádí speciální akci...
              </div>
            </div>
          );
        }

        const actionConfig = {
          peek: { icon: '🔮', title: 'Nahlédnutí na zákony', desc: 'Klikni pro nahlédnutí na 3 zákony na vrcholu balíčku' },
          investigate: { icon: '🔍', title: 'Prošetření hráče', desc: 'Vyber hráče k prošetření - zjistíš jeho frakci' },
          special_election: { icon: '🗳️', title: 'Zvláštní volby', desc: 'Vyber příštího premiéra' },
          execution: { icon: '💀', title: 'Poprava', desc: 'Vyber hráče k popravení' },
        };

        const cfg = actionConfig[action?.type];
        if (!cfg) return null;

        if (action?.type === 'peek') {
          return (
            <div className="action-area">
              <div className="phase-banner phase-active">
                <div className="phase-icon">{cfg.icon}</div>
                <div className="phase-title">{cfg.title}</div>
                <div className="phase-description">{cfg.desc}</div>
              </div>
              <button className="btn btn-primary btn-glow" onClick={() => handleExecutiveAction('peek')}>
                🔮 Nahlédnout
              </button>
            </div>
          );
        }

        return (
          <div className="action-area">
            <div className={`phase-banner phase-active ${action?.type === 'execution' ? 'phase-danger' : ''}`}>
              <div className="phase-icon">{cfg.icon}</div>
              <div className="phase-title">{cfg.title}</div>
              <div className="phase-description">{cfg.desc}</div>
            </div>
            <div className="player-select-grid">
              {gs.players.filter(p => p.alive && p.id !== playerId && (action?.type !== 'investigate' || !p.investigated)).map(p => (
                <button
                  key={p.id}
                  className={`player-select-btn ${action?.type === 'execution' ? 'execution-btn' : ''}`}
                  onClick={() => handleExecutiveAction(action.type, p.id)}
                >
                  <div className="select-emoji">{getCharEmoji(p.character.id)}</div>
                  <div className="select-name">{p.name}</div>
                  <div className="char-name">{p.character.name}</div>
                </button>
              ))}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="phase-banner phase-waiting">
            <div className="phase-icon">⏳</div>
            <div className="phase-title">Čekání...</div>
          </div>
        );
    }
  };

  const renderVotes = () => {
    if (!gs.votes?._revealed) return null;
    return (
      <div className="votes-display">
        {Object.entries(gs.votes).filter(([k]) => k !== '_revealed').map(([pid, v]) => {
          const p = gs.players.find(pl => pl.id === pid);
          return (
            <span key={pid} className={`vote-chip ${v || 'abstain'}`}>
              {p?.name}: {v === 'ja' ? '✅ ANO' : v === 'ne' ? '❌ NE' : '⏸️'}
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
          className={`player-card-mini ${!p.alive ? 'dead' : ''} ${p.id === gs.presidentId ? 'is-president' : ''} ${p.id === gs.ministerId ? 'is-minister' : ''} ${p.id === playerId ? 'is-me' : ''}`}
        >
          <div className="mini-badges">
            {p.id === gs.presidentId && <span className="mini-role-badge president">👑</span>}
            {p.id === gs.ministerId && <span className="mini-role-badge minister">🏛️</span>}
            {!p.alive && <span className="mini-role-badge dead-badge">💀</span>}
          </div>
          <div className="mini-emoji">{getCharEmoji(p.character.id)}</div>
          <div className="mini-name">{p.name}</div>
          <div className="mini-char">{p.character.name}</div>
          {p.alive && !p.abilityUsed && p.character.id !== 'fiala' && (
            <div className="ability-available">⚡ Schopnost</div>
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
          <div className="my-ability-name">{getCharEmoji(charId)} {me.character.name}</div>
          <div className="my-ability-desc">{me.character.ability}</div>
        </div>
        <button
          className="btn btn-gold btn-sm btn-glow"
          onClick={() => needsTarget ? setSelectedTarget('choosing') : handleUseAbility(null)}
        >
          ⚡ Použít
        </button>
      </div>
    );
  };

  const renderAbilityTargetModal = () => {
    if (selectedTarget !== 'choosing') return null;

    return (
      <div className="ability-modal" onClick={() => setSelectedTarget(null)}>
        <div className="ability-modal-content" onClick={e => e.stopPropagation()}>
          <h3>🎯 Vyber cíl schopnosti</h3>
          <p>{me.character.ability}</p>
          <div className="player-select-grid">
            {gs.players.filter(p => p.alive && p.id !== playerId).map(p => (
              <button
                key={p.id}
                className="player-select-btn"
                onClick={() => { handleUseAbility(p.id); setSelectedTarget(null); }}
              >
                <div className="select-emoji">{getCharEmoji(p.character.id)}</div>
                <div>{p.name}</div>
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }} onClick={() => setSelectedTarget(null)}>
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
          <h3>📋 Výsledek</h3>
          {abilityResult.topCards && (
            <div>
              <p>Karty na vrcholu balíčku:</p>
              <div className="policy-cards" style={{ marginTop: '12px' }}>
                {abilityResult.topCards.map((c, i) => (
                  <div key={i} className={`policy-card ${c}`} style={{ cursor: 'default', width: '80px', height: '100px' }}>
                    <div className="policy-card-emoji">{POLICY_EMOJIS[c]}</div>
                    <div>{POLICY_NAMES[c]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {abilityResult.faction && (
            <p>
              Frakce hráče:{' '}
              <span className={`faction-badge ${abilityResult.faction}`}>
                {abilityResult.faction === 'pro_west' ? '🇪🇺 PROZÁPADNÍ' : '☭ PRORUSKÝ'}
              </span>
            </p>
          )}
          {abilityResult.discardedPolicy && (
            <p>
              Zahozený zákon:{' '}
              <span className={`faction-badge ${abilityResult.discardedPolicy}`}>
                {POLICY_EMOJIS[abilityResult.discardedPolicy]} {POLICY_NAMES[abilityResult.discardedPolicy]}
              </span>
            </p>
          )}
          {abilityResult.discardedPolicies && (
            <div>
              <p>Zahozené karty z posledního kola:</p>
              <div className="policy-cards" style={{ marginTop: '12px' }}>
                {abilityResult.discardedPolicies.map((c, i) => (
                  <div key={i} className={`policy-card ${c}`} style={{ cursor: 'default', width: '80px', height: '100px' }}>
                    <div className="policy-card-emoji">{POLICY_EMOJIS[c]}</div>
                    <div>{POLICY_NAMES[c]}</div>
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
                      Kolo {v.round}: {v.vote === 'ja' ? '✅ ANO' : v.vote === 'ne' ? '❌ NE' : '⏸️'}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
          {abilityResult.blocked && (
            <p>🛡️ Poprava hráče {abilityResult.targetName} byla zablokována Generálem Pavlem!</p>
          )}
          {abilityResult.executed && (
            <p>💀 Hráč {abilityResult.executed} byl popraven.</p>
          )}
          <button className="btn btn-primary btn-glow" style={{ marginTop: '16px' }} onClick={() => setAbilityResult(null)}>
            Rozumím
          </button>
        </div>
      </div>
    );
  };

  const renderGameLog = () => (
    <div className="game-log">
      <h4>📋 Herní log</h4>
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
