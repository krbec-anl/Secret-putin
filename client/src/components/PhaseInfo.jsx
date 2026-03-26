export default function PhaseInfo({ gameState, socketId, isPresident, isMinister }) {
  const { phase, players, presidentIndex, nominatedMinisterIndex } = gameState;
  const president = players[presidentIndex];

  const getPhaseText = () => {
    switch (phase) {
      case 'nominate_minister':
        return isPresident
          ? 'Nominuj kandidáta na ministra'
          : `${president?.name} vybírá ministra...`;
      case 'dual_nominate':
        return isPresident
          ? 'Nominuj dva kandidáty na ministra (Fiala)'
          : `${president?.name} vybírá dva kandidáty...`;
      case 'vote':
        return 'Hlasování o vládě';
      case 'president_discard':
        return isPresident
          ? 'Vyber zákon k zahození'
          : `${president?.name} vybírá zákony...`;
      case 'minister_discard':
        return isMinister
          ? 'Vyber zákon k přijetí'
          : 'Ministr vybírá zákon...';
      case 'veto_request':
        return isPresident
          ? 'Ministr žádá o veto – rozhodni'
          : 'Ministr žádá o veto...';
      case 'peek_policies':
        return isPresident
          ? 'Prohlížíš si vrchní karty'
          : `${president?.name} nahlíží na karty...`;
      case 'execution':
        return isPresident
          ? 'Vyber hráče k popravě'
          : `${president?.name} volí cíl popravy...`;
      case 'execution_block':
        return 'Generál Pavel může zasáhnout...';
      case 'investigate':
        return isPresident
          ? 'Vyber hráče k prošetření'
          : `${president?.name} prošetřuje...`;
      case 'special_election':
        return isPresident
          ? 'Vyber dalšího předsedu vlády'
          : `${president?.name} volí nového premiéra...`;
      default:
        return '';
    }
  };

  const text = getPhaseText();
  if (!text) return null;

  return (
    <div style={{
      padding: '10px 16px',
      marginBottom: 12,
      borderRadius: 10,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      textAlign: 'center',
      fontSize: 14,
      fontWeight: 600,
    }}>
      {text}
    </div>
  );
}
