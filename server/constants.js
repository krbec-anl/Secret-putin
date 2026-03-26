const CHARACTERS = [
  { id: 'schillerova', name: 'Alena Schillerová', emoji: '💼', ability: 'peek_discarded', abilityDesc: 'Přinutí premiéra ukázat který zákon zahodil' },
  { id: 'havlicek', name: 'Karel Havlíček', emoji: '🚂', ability: 'return_discarded', abilityDesc: 'Vrátí zahozený zákon zpět do balíčku' },
  { id: 'turek', name: 'Filip Turek', emoji: '🔥', ability: 'block_vote', abilityDesc: 'Zablokuje celé hlasování – kolo se přeskočí' },
  { id: 'macinka', name: 'Tomáš Macinka', emoji: '🏛️', ability: 'peek_deck', abilityDesc: 'Nahlédne na 2 karty na vrcholu balíčku' },
  { id: 'klaus', name: 'Václav Klaus', emoji: '👴', ability: 'force_revote', abilityDesc: 'Vynutí opakování neúspěšného hlasování' },
  { id: 'fiala', name: 'Petr Fiala', emoji: '🤝', ability: 'dual_nominate', abilityDesc: 'Jako premiér nominuje 2 kandidáty, hráči volí kterého chtějí' },
  { id: 'pavel', name: 'Generál Pavel', emoji: '⭐', ability: 'block_execution', abilityDesc: 'Zablokuje popravu libovolného hráče' },
  { id: 'okamura', name: 'Tomio Okamura', emoji: '😤', ability: 'self_nominate', abilityDesc: 'Navrhne sám sebe jako ministra' },
  { id: 'bartos', name: 'Ivan Bartoš', emoji: '💻', ability: 'double_vote', abilityDesc: 'Hlasuje dvakrát, příští kolo nesmí hlasovat vůbec' },
  { id: 'nerudova', name: 'Danuše Nerudová', emoji: '📊', ability: 'peek_last_discarded', abilityDesc: 'Nahlédne na zahozené karty z posledního kola' },
  { id: 'lipavsky', name: 'Jan Lipavský', emoji: '✈️', ability: 'reduce_failcounter', abilityDesc: 'Posune failcounter o -1 zpět' },
  { id: 'rakusan', name: 'Vít Rakušan', emoji: '🚔', ability: 'view_vote_history', abilityDesc: 'Vidí kompletní historii hlasování jednoho hráče' },
];

const FACTION_DISTRIBUTION = {
  6:  { proWest: 4, proRussian: 1, putin: 1 },
  7:  { proWest: 4, proRussian: 2, putin: 1 },
  8:  { proWest: 5, proRussian: 2, putin: 1 },
  9:  { proWest: 5, proRussian: 2, putin: 1 },
  10: { proWest: 6, proRussian: 3, putin: 1 },
  11: { proWest: 6, proRussian: 3, putin: 1 },
  12: { proWest: 7, proRussian: 4, putin: 1 },
};

// Presidential powers based on player count and number of pro-russian policies enacted
// Same structure as Secret Hitler
const PRESIDENTIAL_POWERS = {
  // 5-6 players
  small: {
    1: null,
    2: null,
    3: 'peek_policies',      // Top 3 cards
    4: 'execution',
    5: 'execution',
  },
  // 7-8 players
  medium: {
    1: null,
    2: 'investigate',
    3: 'special_election',
    4: 'execution',
    5: 'execution',
  },
  // 9-10 players
  large: {
    1: 'investigate',
    2: 'investigate',
    3: 'special_election',
    4: 'execution',
    5: 'execution',
  },
};

function getPresidentialPowerTier(playerCount) {
  if (playerCount <= 6) return 'small';
  if (playerCount <= 8) return 'medium';
  return 'large';
}

const PRO_RUSSIAN_POLICY_NAMES = [
  'Závislost na Gazpromu',
  'Odchod z NATO',
  'Veto v EU',
  'Zákaz kritiky Kremlu',
  'Zrušení sankcí',
  'Výstup z Evropské unie',
  'Ruská vojenská základna',
  'Blokáda pomoci Ukrajině',
  'Dezinformační zákon',
  'Rozbití V4 aliance',
  'Ruský jaderný reaktor',
];

const PRO_WEST_POLICY_NAMES = [
  'Sankce proti Rusku',
  'Zbrojní pomoc Ukrajině',
  'Vstup do jádra EU',
  'Posílení NATO',
  'Energetická nezávislost',
  'Ochrana médií',
];

const PHASES = {
  LOBBY: 'lobby',
  ROLE_REVEAL: 'role_reveal',
  NOMINATE_MINISTER: 'nominate_minister',
  DUAL_NOMINATE: 'dual_nominate',
  VOTE: 'vote',
  PRESIDENT_DISCARD: 'president_discard',
  MINISTER_DISCARD: 'minister_discard',
  POLICY_ENACTED: 'policy_enacted',
  PRESIDENTIAL_POWER: 'presidential_power',
  INVESTIGATE: 'investigate',
  SPECIAL_ELECTION: 'special_election',
  EXECUTION: 'execution',
  EXECUTION_BLOCK: 'execution_block',
  GAME_OVER: 'game_over',
  PEEK_POLICIES: 'peek_policies',
  VETO_REQUEST: 'veto_request',
};

module.exports = {
  CHARACTERS,
  FACTION_DISTRIBUTION,
  PRESIDENTIAL_POWERS,
  getPresidentialPowerTier,
  PRO_RUSSIAN_POLICY_NAMES,
  PRO_WEST_POLICY_NAMES,
  PHASES,
};
