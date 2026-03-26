// Player count configurations
export const PLAYER_CONFIG = {
  6:  { proWest: 4, proRussian: 1, putin: 1 },
  7:  { proWest: 4, proRussian: 2, putin: 1 },
  8:  { proWest: 5, proRussian: 2, putin: 1 },
  9:  { proWest: 5, proRussian: 2, putin: 1 },
  10: { proWest: 6, proRussian: 3, putin: 1 },
  11: { proWest: 6, proRussian: 3, putin: 1 },
  12: { proWest: 7, proRussian: 4, putin: 1 },
};

// Characters
export const CHARACTERS = [
  {
    id: 'schillerova',
    name: 'Alena Schillerová',
    ability: 'Přinutí premiéra ukázat který zákon zahodil',
    description: 'Ministryně financí vždy věděla co se skrývá v číslech',
  },
  {
    id: 'havlicek',
    name: 'Karel Havlíček',
    ability: 'Vrátí zahozený zákon zpět do balíčku',
    description: 'Jeho projekty nikdy neumírají',
  },
  {
    id: 'turek',
    name: 'Filip Turek',
    ability: 'Zablokuje celé hlasování – kolo se přeskočí (+1 failcounter)',
    description: 'Europarlament zažil co umí',
  },
  {
    id: 'macinka',
    name: 'Tomáš Macinka',
    ability: 'Nahlédne na 2 karty na vrcholu balíčku',
    description: 'Šéf sněmovny ví co přijde na program',
  },
  {
    id: 'klaus',
    name: 'Václav Klaus',
    ability: 'Vynutí opakování neúspěšného hlasování',
    description: 'Prezidentské veto',
  },
  {
    id: 'fiala',
    name: 'Petr Fiala',
    ability: 'Jako premiér nominuje 2 kandidáty, hráči volí kterého chtějí',
    description: 'Koaliční vláda – nikdy nerozhoduje sám',
  },
  {
    id: 'pavel',
    name: 'Generál Pavel',
    ability: 'Zablokuje popravu libovolného hráče',
    description: 'Velitel armády chrání své lidi',
  },
  {
    id: 'okamura',
    name: 'Tomio Okamura',
    ability: 'Navrhne sám sebe jako ministra',
    description: 'Nikdy nečeká na pozvání',
  },
  {
    id: 'bartos',
    name: 'Ivan Bartoš',
    ability: 'Hlasuje dvakrát, příští kolo nesmí hlasovat vůbec',
    description: 'Digitalizace – dvakrát rychle, pak výpadek',
  },
  {
    id: 'nerudova',
    name: 'Danuše Nerudová',
    ability: 'Nahlédne na zahozené karty z posledního kola',
    description: 'Ekonomka analyzuje co ostatní skrývají',
  },
  {
    id: 'lipavsky',
    name: 'Jan Lipavský',
    ability: 'Posune failcounter o -1 zpět',
    description: 'Diplomat který deeskaluje krizi',
  },
  {
    id: 'rakusan',
    name: 'Vít Rakušan',
    ability: 'Vidí kompletní historii hlasování jednoho hráče',
    description: 'Ministr vnitra sleduje občany',
  },
];

// Policy types
export const POLICY = {
  PRO_WEST: 'pro_west',
  PRO_RUSSIAN: 'pro_russian',
};

// Pro-Russian law names
export const PRO_RUSSIAN_LAWS = [
  'Závislost na Gazpromu',
  'Odchod z NATO',
  'Veto v EU',
  'Zrušení sankcí',
  'Uzavření hranic pro uprchlíky',
  'Výstup z Europolu',
  'Zákaz nezávislých médií',
  'Smlouva o neútočení s Ruskem',
  'Odstoupení od Pařížské dohody',
  'Rozpuštění BIS',
  'Uznání anexe Krymu',
];

// Pro-Western law names
export const PRO_WEST_LAWS = [
  'Sankce proti Rusku',
  'Zbrojní pomoc Ukrajině',
  'Vstup do kybernetické aliance',
  'Posílení NATO východního křídla',
  'Energetická nezávislost',
  'Podpora demokratických médií',
];

// Game phases
export const PHASE = {
  LOBBY: 'lobby',
  ROLE_REVEAL: 'role_reveal',
  NOMINATE_MINISTER: 'nominate_minister',
  FIALA_NOMINATION: 'fiala_nomination',
  FIALA_VOTE: 'fiala_vote',
  VOTING: 'voting',
  PRESIDENT_DISCARD: 'president_discard',
  MINISTER_DISCARD: 'minister_discard',
  POLICY_ENACTED: 'policy_enacted',
  EXECUTIVE_ACTION: 'executive_action',
  INVESTIGATE: 'investigate',
  SPECIAL_ELECTION: 'special_election',
  EXECUTION: 'execution',
  GAME_OVER: 'game_over',
  ABILITY_PHASE: 'ability_phase',
  VETO_REQUEST: 'veto_request',
};

// Executive actions based on player count and proRussian policies enacted
// Same as Secret Hitler board
export const EXECUTIVE_ACTIONS = {
  // 5-6 players
  small: {
    1: null,
    2: null,
    3: 'peek',       // Peek at top 3 policies
    4: 'execution',
    5: 'execution',  // + veto power unlocked
  },
  // 7-8 players
  medium: {
    1: null,
    2: 'investigate',
    3: 'special_election',
    4: 'execution',
    5: 'execution',
  },
  // 9-12 players
  large: {
    1: 'investigate',
    2: 'investigate',
    3: 'special_election',
    4: 'execution',
    5: 'execution',
  },
};

export function getBoardSize(playerCount) {
  if (playerCount <= 6) return 'small';
  if (playerCount <= 8) return 'medium';
  return 'large';
}
