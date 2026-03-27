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
    satire: 'Jako ministryně financí nikdy nevěděla kolik stojí rohlík, ale vždy věděla co se skrývá v číslech. Spolehlivá, loajální, a vždy po boku toho správného šéfa.',
    ability: 'Jednou přinutí premiéra ukázat který zákon zahodil. Čísla nelžou – ale politici ano.',
    description: 'Ministryně financí vždy věděla co se skrývá v číslech',
  },
  {
    id: 'havlicek',
    name: 'Karel Havlíček',
    satire: 'Ministr, předseda, kandidát – Karel nikdy nevzdává. Jeho projekty přežijí i nukleární zimu.',
    ability: 'Jednou vrátí zahozený zákon zpět do balíčku. Co bylo pohřbeno, vstane z mrtvých.',
    description: 'Jeho projekty nikdy neumírají',
  },
  {
    id: 'turek',
    name: 'Filip Turek',
    satire: 'Europarlament zažil ledacos, ale Filipa Turka nečekal nikdo. Ani on sám.',
    ability: 'Jednou zablokuje celé hlasování. Kolo se přeskočí – a nikdo neví proč.',
    description: 'Europarlament zažil co umí',
  },
  {
    id: 'macinka',
    name: 'Tomáš Macinka',
    satire: 'Šéf sněmovny vždy ví co přijde na program. Někdy i dřív než to ostatní navrhnou.',
    ability: 'Jednou nahlédne na 2 karty na vrcholu balíčku. Informace je moc.',
    description: 'Šéf sněmovny ví co přijde na program',
  },
  {
    id: 'klaus',
    name: 'Václav Klaus',
    satire: 'Prezident, ekonom, lyžař. Václav Klaus nikdy nebyl jen tak. A jeho veto? To je teprve kapitola sama o sobě.',
    ability: 'Jednou vynutí opakování neúspěšného hlasování. Co se nelíbí, jede znovu.',
    description: 'Prezidentské veto',
  },
  {
    id: 'fiala',
    name: 'Petr Fiala',
    satire: 'Koalice pěti stran, sto kompromisů, nula rozhodnutí bez porady. Petr Fiala nikdy nerozhoduje sám.',
    ability: 'Jako premiér nominuje 2 kandidáty na ministra a hráči volí kterého chtějí. Demokracie v praxi.',
    description: 'Koaliční vláda – nikdy nerozhoduje sám',
  },
  {
    id: 'pavel',
    name: 'Generál Pavel',
    satire: 'Generál, prezident, symbol. Petr Pavel přežil studenou válku, NATO i české volby.',
    ability: 'Jednou zablokuje popravu libovolného hráče. Voják chrání své lidi – i když to nedává politický smysl.',
    description: 'Velitel armády chrání své lidi',
  },
  {
    id: 'okamura',
    name: 'Tomio Okamura',
    satire: 'Tomio nikdy nečeká na pozvání. Na demonstrace, do sněmovny, do vlády – prostě přijde.',
    ability: 'Jednou se může nominovat sám za ministra. Pozvánka není potřeba.',
    description: 'Nikdy nečeká na pozvání',
  },
  {
    id: 'bartos',
    name: 'Ivan Bartoš',
    satire: 'Digitalizace státní správy za pouhých 7 miliard a pár skandálů. Dvakrát rychle, pak totální výpadek.',
    ability: 'Jednou hlasuje dvakrát, ale příští kolo nemůže hlasovat vůbec. Chyba systému.',
    description: 'Digitalizace – dvakrát rychle, pak výpadek',
  },
  {
    id: 'nerudova',
    name: 'Danuše Nerudová',
    satire: 'Ekonomka, rektorka, kandidátka. Danuše vždy analyzuje data – a data neklamou, jen lidé okolo nich.',
    ability: 'Jednou nahlédne na zahozené karty z posledního kola. Víte co ostatní skrývají?',
    description: 'Ekonomka analyzuje co ostatní skrývají',
  },
  {
    id: 'lipavsky',
    name: 'Jan Lipavský',
    satire: 'Ministr zahraničí který cestoval více než průměrný influencer. Každá cesta za mírem, každý úsměv za vlast.',
    ability: 'Jednou posune failcounter o -1 zpět. Diplomat vždy deeskaluje.',
    description: 'Diplomat který deeskaluje krizi',
  },
  {
    id: 'rakusan',
    name: 'Vít Rakušan',
    satire: 'Ministr vnitra ví o vás více než vy sami. STAN, bezpečnost, data občanů – Vít má přehled.',
    ability: 'Jednou vidí kompletní historii hlasování jednoho hráče. Sledování je jeho práce.',
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
  VOTE_RESULT: 'vote_result',
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
