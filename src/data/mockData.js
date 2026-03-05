/* eslint-disable */

// ---------- NAV SECTIONS ----------
export const NAV_SECTIONS = [
  {
    title: 'Hlavní',
    items: [
      { id: 'dashboard',    label: 'Dashboard',           icon: 'dashboard' },
      { id: 'properties',   label: 'Nemovitosti',         icon: 'building' },
      { id: 'tenants',      label: 'Nájemníci',           icon: 'people' },
    ],
  },
  {
    title: 'Správa',
    items: [
      { id: 'propertyList', label: 'Seznam nemovitostí',  icon: 'list' },
      { id: 'finance',      label: 'Finance',             icon: 'finance' },
      { id: 'obligations',  label: 'Povinnosti a revize', icon: 'clipboard' },
      { id: 'maintenance',  label: 'Údržba',              icon: 'wrench' },
    ],
  },
  {
    title: 'Komunikace',
    items: [
      { id: 'communication', label: 'Komunikace',         icon: 'message' },
    ],
  },
  {
    title: 'Vlastníci',
    items: [
      { id: 'owners',       label: 'Portál vlastníků',    icon: 'key' },
    ],
  },
];

export const NAV_FLAT = NAV_SECTIONS.flatMap(sec => sec.items);

// ============================================================
//  DEMO DATA
// ============================================================

export const INITIAL_PROPERTIES = [
  {
    id: 1, name: 'Tyršova 1872', city: 'Žatec', address: 'Tyršova 1872, Žatec',
    ownership: 'own', owner: null, totalUnits: 6, monthlyIncome: 42000,
    units: [
      { id: '1A', type: '2+1', area: 55, rent: 7500, tenant: 'Jan Novák', status: 'occupied', contractEnd: '2027-03-15', deposit: 15000, balance: 0 },
      { id: '1B', type: '1+1', area: 38, rent: 5500, tenant: 'Marie Svobodová', status: 'occupied', contractEnd: '2026-08-31', deposit: 11000, balance: -5500 },
      { id: '2A', type: '3+1', area: 72, rent: 9000, tenant: 'Petr Dvořák', status: 'occupied', contractEnd: '2026-12-31', deposit: 18000, balance: 0 },
      { id: '2B', type: '2+1', area: 56, rent: 7500, tenant: null, status: 'vacant', contractEnd: null, deposit: 0, balance: 0 },
      { id: '3A', type: '2+kk', area: 48, rent: 6500, tenant: 'Jana Černá', status: 'occupied', contractEnd: '2027-06-30', deposit: 13000, balance: 0 },
      { id: '3B', type: '1+1', area: 36, rent: 5000, tenant: 'Tomáš Procházka', status: 'occupied', contractEnd: '2026-05-15', deposit: 10000, balance: -10000 },
    ],
    obligations: [
      { id: 1, name: 'Revize komínu', category: 'revize', expiryDate: '2027-01-15', documentName: 'Revize komín 2025.pdf' },
      { id: 2, name: 'Revize elektroinstalace', category: 'revize', expiryDate: '2026-04-10', documentName: 'Elektro revize 2025.pdf' },
      { id: 3, name: 'Pojistná smlouva budovy', category: 'pojistka', expiryDate: '2026-03-15', documentName: 'Pojistka budova 2025.pdf' },
      { id: 4, name: 'Požární bezpečnost', category: 'hygiena', expiryDate: '2025-12-01', documentName: null },
      { id: 5, name: 'Stavební povolení - přístavba', category: 'povoleni', expiryDate: '2028-06-30', documentName: 'Stavební povolení.pdf' },
    ]
  },
  {
    id: 2, name: 'Důlce 2331/15', city: 'Žatec', address: 'Důlce 2331/15, Žatec',
    ownership: 'own', owner: null, totalUnits: 4, monthlyIncome: 28000,
    units: [
      { id: '1', type: '2+1', area: 52, rent: 7000, tenant: 'Eva Veselá', status: 'occupied', contractEnd: '2027-01-31', deposit: 14000, balance: 0 },
      { id: '2', type: '2+kk', area: 45, rent: 6500, tenant: 'Martin Kučera', status: 'occupied', contractEnd: '2026-09-30', deposit: 13000, balance: -13000 },
      { id: '3', type: '3+1', area: 68, rent: 8500, tenant: 'Lucie Pokorná', status: 'occupied', contractEnd: '2027-04-15', deposit: 17000, balance: 0 },
      { id: '4', type: '1+1', area: 34, rent: 5000, tenant: null, status: 'vacant', contractEnd: null, deposit: 0, balance: 0 },
    ],
    obligations: [
      { id: 6, name: 'Revize hasicích přístrojů', category: 'revize', expiryDate: '2026-08-12', documentName: 'HP revize 2025.pdf' },
      { id: 7, name: 'Smlouva o správě budovy', category: 'smlouva', expiryDate: '2026-05-20', documentName: 'Správcovská smlouva.pdf' },
      { id: 8, name: 'Pojištění nemovitosti', category: 'pojistka', expiryDate: '2025-11-15', documentName: null },
    ]
  },
  {
    id: 3, name: 'Liškova 907/13', city: 'Most', address: 'Liškova 907/13, Most',
    ownership: 'own', owner: null, totalUnits: 8, monthlyIncome: 58000,
    units: [
      { id: '1A', type: '2+1', area: 54, rent: 7000, tenant: 'Jiří Hájek', status: 'occupied', contractEnd: '2026-11-30', deposit: 14000, balance: 0 },
      { id: '1B', type: '1+kk', area: 32, rent: 4500, tenant: 'Alena Králová', status: 'occupied', contractEnd: '2027-02-28', deposit: 9000, balance: 0 },
      { id: '2A', type: '3+1', area: 75, rent: 9500, tenant: 'Michal Marek', status: 'occupied', contractEnd: '2026-06-30', deposit: 19000, balance: -9500 },
      { id: '2B', type: '2+kk', area: 48, rent: 6500, tenant: 'Petra Jelínková', status: 'occupied', contractEnd: '2027-08-15', deposit: 13000, balance: 0 },
      { id: '3A', type: '2+1', area: 55, rent: 7500, tenant: null, status: 'vacant', contractEnd: null, deposit: 0, balance: 0 },
      { id: '3B', type: '1+1', area: 38, rent: 5500, tenant: 'Ondřej Fiala', status: 'occupied', contractEnd: '2026-10-31', deposit: 11000, balance: 0 },
      { id: '4A', type: '2+1', area: 53, rent: 7000, tenant: 'Barbora Benešová', status: 'occupied', contractEnd: '2027-05-31', deposit: 14000, balance: 0 },
      { id: '4B', type: '3+kk', area: 65, rent: 8500, tenant: 'Pavel Šťastný', status: 'occupied', contractEnd: '2026-04-15', deposit: 17000, balance: -17000 },
    ],
    obligations: [
      { id: 9, name: 'Revize hromosvodu', category: 'revize', expiryDate: '2026-09-20', documentName: 'Hromosvod revize 2024.pdf' },
      { id: 10, name: 'Pojištění odpovědnosti', category: 'pojistka', expiryDate: '2026-06-01', documentName: 'Pojistka odpovědnost.pdf' },
      { id: 11, name: 'Revize plynových rozvodů', category: 'revize', expiryDate: '2026-03-28', documentName: null },
    ]
  },
  {
    id: 4, name: 'Pod Širokým vrchem 124', city: 'Most', address: 'Pod Širokým vrchem 124, Most',
    ownership: 'own', owner: null, totalUnits: 5, monthlyIncome: 35500,
    units: [
      { id: '1', type: '2+1', area: 58, rent: 7500, tenant: 'Kateřina Doležalová', status: 'occupied', contractEnd: '2027-07-31', deposit: 15000, balance: 0 },
      { id: '2', type: '2+kk', area: 46, rent: 6500, tenant: 'David Horák', status: 'occupied', contractEnd: '2026-03-31', deposit: 13000, balance: 0 },
      { id: '3', type: '3+1', area: 70, rent: 9000, tenant: 'Monika Němcová', status: 'occupied', contractEnd: '2027-01-15', deposit: 18000, balance: 0 },
      { id: '4', type: '1+1', area: 35, rent: 5000, tenant: 'Lukáš Staněk', status: 'occupied', contractEnd: '2026-06-15', deposit: 10000, balance: -5000 },
      { id: '5', type: '2+1', area: 55, rent: 7500, tenant: null, status: 'vacant', contractEnd: null, deposit: 0, balance: 0 },
    ],
    obligations: [
      { id: 12, name: 'Revize kotle', category: 'revize', expiryDate: '2026-11-30', documentName: 'Revize kotle 2025.pdf' },
      { id: 13, name: 'Energetický audit', category: 'jine', expiryDate: '2028-01-15', documentName: 'Energetický audit.pdf' },
      { id: 14, name: 'Hyg. kontrola společ. prostor', category: 'hygiena', expiryDate: '2025-10-01', documentName: null },
    ]
  },
  {
    id: 5, name: 'Komenského 45', city: 'Ústí nad Labem', address: 'Komenského 45, Ústí nad Labem',
    ownership: 'foreign', owner: 'Ing. Novák', totalUnits: 8, monthlyIncome: 62000,
    units: [
      { id: '1A', type: '2+1', area: 56, rent: 7500, tenant: 'Simona Kopecká', status: 'occupied', contractEnd: '2027-03-31', deposit: 15000, balance: 0 },
      { id: '1B', type: '2+kk', area: 44, rent: 6500, tenant: 'Roman Vlček', status: 'occupied', contractEnd: '2026-07-15', deposit: 13000, balance: -6500 },
      { id: '2A', type: '3+1', area: 74, rent: 9500, tenant: 'Tereza Malá', status: 'occupied', contractEnd: '2026-12-31', deposit: 19000, balance: 0 },
      { id: '2B', type: '1+1', area: 36, rent: 5000, tenant: 'Jakub Urban', status: 'occupied', contractEnd: '2027-06-30', deposit: 10000, balance: 0 },
      { id: '3A', type: '2+1', area: 55, rent: 7500, tenant: null, status: 'vacant', contractEnd: null, deposit: 0, balance: 0 },
      { id: '3B', type: '2+kk', area: 47, rent: 6500, tenant: 'Markéta Sedláčková', status: 'occupied', contractEnd: '2026-09-30', deposit: 13000, balance: 0 },
      { id: '4A', type: '3+kk', area: 62, rent: 8500, tenant: 'Filip Blažek', status: 'occupied', contractEnd: '2027-04-30', deposit: 17000, balance: 0 },
      { id: '4B', type: '1+kk', area: 30, rent: 4500, tenant: 'Veronika Kratochvílová', status: 'occupied', contractEnd: '2026-11-15', deposit: 9000, balance: -9000 },
    ],
    obligations: [
      { id: 15, name: 'Správcovská smlouva', category: 'smlouva', expiryDate: '2027-01-15', documentName: 'Správcovská smlouva Novák.pdf' },
      { id: 16, name: 'Revize elektroinstalace', category: 'revize', expiryDate: '2026-07-22', documentName: 'Elektro revize 2025.pdf' },
      { id: 17, name: 'Pojistná smlouva', category: 'pojistka', expiryDate: '2026-04-15', documentName: 'Pojistka Komenského.pdf' },
      { id: 18, name: 'Protipožární kontrola', category: 'hygiena', expiryDate: '2025-09-30', documentName: null },
    ]
  },
  {
    id: 6, name: 'Masarykova 12', city: 'Most', address: 'Masarykova 12, Most',
    ownership: 'foreign', owner: 'Bc. Dvořáková', totalUnits: 9, monthlyIncome: 64500,
    units: [
      { id: '1A', type: '2+1', area: 54, rent: 7000, tenant: 'Radek Kolář', status: 'occupied', contractEnd: '2027-02-28', deposit: 14000, balance: 0 },
      { id: '1B', type: '1+1', area: 37, rent: 5500, tenant: 'Helena Žáková', status: 'occupied', contractEnd: '2026-05-31', deposit: 11000, balance: -11000 },
      { id: '1C', type: '2+kk', area: 46, rent: 6500, tenant: 'Vladimír Pospíšil', status: 'occupied', contractEnd: '2026-10-15', deposit: 13000, balance: 0 },
      { id: '2A', type: '3+1', area: 72, rent: 9000, tenant: 'Daniela Tichá', status: 'occupied', contractEnd: '2027-07-31', deposit: 18000, balance: 0 },
      { id: '2B', type: '2+1', area: 55, rent: 7500, tenant: 'Adam Konečný', status: 'occupied', contractEnd: '2026-08-15', deposit: 15000, balance: -7500 },
      { id: '2C', type: '1+kk', area: 31, rent: 4500, tenant: null, status: 'vacant', contractEnd: null, deposit: 0, balance: 0 },
      { id: '3A', type: '2+kk', area: 48, rent: 6500, tenant: 'Ivana Vaňková', status: 'occupied', contractEnd: '2027-01-31', deposit: 13000, balance: 0 },
      { id: '3B', type: '3+kk', area: 64, rent: 8500, tenant: 'Marek Šimůnek', status: 'occupied', contractEnd: '2026-04-30', deposit: 17000, balance: -8500 },
      { id: '3C', type: '2+1', area: 52, rent: 7000, tenant: 'Zuzana Holubová', status: 'occupied', contractEnd: '2027-09-15', deposit: 14000, balance: 0 },
    ],
    obligations: [
      { id: 19, name: 'Správcovská smlouva', category: 'smlouva', expiryDate: '2026-11-01', documentName: 'Správcovská smlouva Dvořáková.pdf' },
      { id: 20, name: 'Revize komínu', category: 'revize', expiryDate: '2026-05-18', documentName: 'Komín revize 2025.pdf' },
      { id: 21, name: 'Stavební povolení - výtah', category: 'povoleni', expiryDate: '2027-12-31', documentName: 'Stavební povolení výtah.pdf' },
    ]
  },
];

export const FINANCE_MONTHLY = [
  { month: 'Bře 25', income: 272000, expenses: 98000 },
  { month: 'Dub 25', income: 278000, expenses: 105000 },
  { month: 'Kvě 25', income: 275000, expenses: 88000 },
  { month: 'Čvn 25', income: 280000, expenses: 112000 },
  { month: 'Čvc 25', income: 268000, expenses: 95000 },
  { month: 'Srp 25', income: 282000, expenses: 102000 },
  { month: 'Zář 25', income: 285000, expenses: 89000 },
  { month: 'Říj 25', income: 279000, expenses: 135000 },
  { month: 'Lis 25', income: 288000, expenses: 97000 },
  { month: 'Pro 25', income: 290000, expenses: 142000 },
  { month: 'Led 26', income: 287000, expenses: 108000 },
  { month: 'Úno 26', income: 290000, expenses: 115000 },
];

export const OBL_OBJECTS = [
  'Sídlo-Stroupežnického UL', 'Ředitelství-Koněvova UL', 'Děti+Piknik-Štefánikova UL',
  'CDZ-Tichá UL', 'TDZ-Teplická DC', 'TDZ-Školní TP', 'CDZ-Liškova LTM', 'TDZ-Most',
  'CDZ-Čelakovského CHV', 'CDZ-Tyršova Žatec', 'Vaňov', 'Resslovka', 'LaBuž',
  'Chaloupka', 'Piknik DC', 'LaŠik', 'Mobilní dílna', 'Tiskárna',
];

export const REV_TYPES = [
  { name: 'Komín', period: '1\u00d7rok', supplier: 'Enetep' },
  { name: 'Hromosvod', period: '1\u00d74roky', supplier: 'Enetep' },
  { name: 'Elektro spot\u0159.', period: '1\u00d7rok', supplier: 'p.\u0160avel' },
  { name: 'Hasic\u00ed p\u0159\u00edstr.', period: '1\u00d7rok', supplier: 'p.Kulhav\u00fd' },
  { name: 'Plyn', period: '', supplier: 'Enetep' },
  { name: 'Kotle', period: '', supplier: 'Enetep' },
  { name: 'Reg\u00e1ly', period: '1\u00d7rok', supplier: 'FL' },
  { name: 'Proj. dok.', period: '', supplier: '' },
  { name: 'Proj.dok. elektro', period: '', supplier: '' },
  { name: 'Elektro budovy', period: '1\u00d75let', supplier: '' },
  { name: 'PB\u0158', period: '', supplier: '' },
];

// ---------- MATRIX DATA MODEL ----------
function genInitialMatrix() {
  const m = {};
  const preDocs = [
    ['Sídlo-Stroupežnického UL', 'Komín', 'Revize komín 2025.pdf', '2025-06-10', '1.2 MB'],
    ['Sídlo-Stroupežnického UL', 'Hromosvod', 'Revize hromosvod 2024.pdf', '2024-03-15', '2.1 MB'],
    ['Ředitelství-Koněvova UL', 'Komín', 'Revize komín 2025.pdf', '2025-07-20', '980 KB'],
    ['Ředitelství-Koněvova UL', 'Elektro spotř.', 'Elektro revize 2025.pdf', '2025-09-01', '1.5 MB'],
    ['Ředitelství-Koněvova UL', 'Hasicí přístr.', 'Hasicí přístroje 2025.pdf', '2025-05-12', '750 KB'],
    ['CDZ-Tichá UL', 'Plyn', 'Revize plyn 2025.pdf', '2025-11-08', '1.8 MB'],
    ['CDZ-Tichá UL', 'Kotle', 'Revize kotle 2025.pdf', '2025-11-08', '2.3 MB'],
    ['TDZ-Teplická DC', 'Komín', 'Komín revize 2025.pdf', '2025-04-18', '1.1 MB'],
    ['TDZ-Teplická DC', 'Regály', 'Kontrola regálů 2025.pdf', '2025-08-22', '680 KB'],
    ['CDZ-Tyršova Žatec', 'Elektro spotř.', 'Elektro revize 2025.pdf', '2025-10-15', '1.4 MB'],
    ['CDZ-Tyršova Žatec', 'Hasicí přístr.', 'Hasicí přístroje 2025.pdf', '2025-06-30', '890 KB'],
    ['Vaňov', 'Komín', 'Revize komín Vaňov.pdf', '2025-12-01', '1.0 MB'],
    ['Resslovka', 'Elektro budovy', 'Elektro budovy revize 2024.pdf', '2024-07-14', '3.2 MB'],
    ['LaBuž', 'Hasicí přístr.', 'HP revize 2025.pdf', '2025-03-20', '520 KB'],
    ['Děti+Piknik-Štefánikova UL', 'PBŘ', 'Požární řád 2024.pdf', '2024-01-15', '4.1 MB'],
    ['Mobilní dílna', 'Hasicí přístr.', 'HP kontrola 2025.pdf', '2025-09-10', '450 KB'],
    ['Tiskárna', 'Elektro spotř.', 'Elektro revize tiskárna 2025.pdf', '2025-08-05', '1.1 MB'],
    ['Sídlo-Stroupežnického UL', 'Elektro spotř.', 'Elektro revize 2025.pdf', '2025-08-20', '1.6 MB'],
    ['CDZ-Liškova LTM', 'Komín', 'Revize komín 2025.pdf', '2025-05-15', '1.3 MB'],
  ];
  const preHistory = [
    ['Sídlo-Stroupežnického UL', 'Elektro spotř.', 'Elektro revize 2024.pdf', '2024-08-15', '1.4 MB'],
    ['CDZ-Liškova LTM', 'Komín', 'Revize komín 2024.pdf', '2024-05-10', '1.1 MB'],
    ['CDZ-Liškova LTM', 'Komín', 'Revize komín 2023.pdf', '2023-04-22', '980 KB'],
  ];

  let docId = 1;
  OBL_OBJECTS.forEach((obj, oi) => {
    m[obj] = {};
    REV_TYPES.forEach((rt, ti) => {
      const seed = (oi * 13 + ti * 7 + 42) % 100;
      let deadline = null;
      if (seed >= 10) {
        const off = ((oi * 37 + ti * 59 + 11) % 540) - 80;
        const dt = new Date(2026, 1, 27);
        dt.setDate(dt.getDate() + off);
        deadline = dt.toISOString().split('T')[0];
      }

      const cellDocs = [];
      const pre = preDocs.filter(([o, r]) => o === obj && r === rt.name);
      pre.forEach(([, , name, date, size]) => {
        cellDocs.push({ id: 'rd' + (docId++), name, date, size });
      });
      const hist = preHistory.filter(([o, r]) => o === obj && r === rt.name);
      hist.forEach(([, , name, date, size]) => {
        cellDocs.push({ id: 'rd' + (docId++), name, date, size });
      });

      m[obj][rt.name] = { deadline, docs: cellDocs, company: rt.supplier || '' };
    });
  });
  return m;
}
export const INITIAL_MATRIX = genInitialMatrix();

export const MAINTENANCE = [
  { id: 1, property: 'Tyršova 1872, Žatec', unit: '2A', title: 'Prasklá trubka v koupelně', priority: 'high', status: 'in_progress', created: '2026-02-20', assignee: 'Instalatér Novotný', desc: 'Nájemník hlásí únik vody pod vanou. Nutná okamžitá oprava.' },
  { id: 2, property: 'Liškova 907/13, Most', unit: '3B', title: 'Nefunguje zvonek', priority: 'low', status: 'new', created: '2026-02-25', assignee: null, desc: 'Zvonek u vchodových dveří nereaguje na stisk.' },
  { id: 3, property: 'Komenského 45, Ústí n.L.', unit: '2A', title: 'Výměna oken - reklamace', priority: 'medium', status: 'in_progress', created: '2026-01-15', assignee: 'Okna Ústí s.r.o.', desc: 'Netěsnost nově instalovaných oken, foukání v pravém horním rohu.' },
  { id: 4, property: 'Důlce 2331/15, Žatec', unit: '1', title: 'Plíseň v koupelně', priority: 'high', status: 'new', created: '2026-02-22', assignee: null, desc: 'Rozsáhlý výskyt plísně za vanou a na stropě koupelny.' },
  { id: 5, property: 'Masarykova 12, Most', unit: '3B', title: 'Porucha kotle', priority: 'high', status: 'resolved', created: '2026-01-10', assignee: 'Topenář Krátký', desc: 'Kotel se samovolně vypíná. Vyměněn termostat.' },
  { id: 6, property: 'Pod Šir. vrchem 124, Most', unit: '3', title: 'Zatéká střechou', priority: 'high', status: 'in_progress', created: '2026-02-05', assignee: 'Klempíř Baxa', desc: 'Při silném dešti zatéká do podkrovního bytu.' },
  { id: 7, property: 'Tyršova 1872, Žatec', unit: '1A', title: 'Rozbitá roleta', priority: 'low', status: 'new', created: '2026-02-26', assignee: null, desc: 'Venkovní roleta v ložnici nejde stáhnout.' },
  { id: 8, property: 'Liškova 907/13, Most', unit: '1A', title: 'Výměna zámku vchod. dveří', priority: 'medium', status: 'resolved', created: '2026-01-28', assignee: 'Zámečník Pech', desc: 'Opotřebovaný zámek hlavních dveří domu.' },
  { id: 9, property: 'Komenského 45, Ústí n.L.', unit: '4A', title: 'Spadlá omítka na chodbě', priority: 'medium', status: 'new', created: '2026-02-18', assignee: null, desc: 'V 2. patře se uvolnila omítka stropu na chodbě.' },
  { id: 10, property: 'Masarykova 12, Most', unit: '1B', title: 'Ucpaný odpad kuchyň', priority: 'medium', status: 'resolved', created: '2026-02-01', assignee: 'Instalatér Novotný', desc: 'Odtok v kuchyňském dřezu neodtéká. Vyčištěno.' },
];

export const INITIAL_DOCUMENTS = [
  { id: 1, propertyId: 1, name: 'Revizní zpráva - Komín 2025.pdf', category: 'revize', revisionType: 'Komín', date: '2025-11-15', size: '2.4 MB' },
  { id: 2, propertyId: 1, name: 'Revizní zpráva - Elektro 2025.pdf', category: 'revize', revisionType: 'Elektro spotř.', date: '2025-09-20', size: '1.8 MB' },
  { id: 3, propertyId: 1, name: 'Nájemní smlouva - Jan Novák.pdf', category: 'smlouvy', revisionType: null, date: '2024-03-15', size: '540 KB' },
  { id: 4, propertyId: 1, name: 'Pojistná smlouva 2025.pdf', category: 'pojisteni', revisionType: null, date: '2025-01-10', size: '1.1 MB' },
  { id: 5, propertyId: 1, name: 'Energetický štítek.pdf', category: 'technicke', revisionType: null, date: '2023-06-01', size: '3.2 MB' },
  { id: 6, propertyId: 2, name: 'Revizní zpráva - Hasicí přístr. 2025.pdf', category: 'revize', revisionType: 'Hasicí přístr.', date: '2025-08-12', size: '980 KB' },
  { id: 7, propertyId: 2, name: 'Kupní smlouva.pdf', category: 'smlouvy', revisionType: null, date: '2020-05-20', size: '4.5 MB' },
  { id: 8, propertyId: 3, name: 'Revizní zpráva - Hromosvod 2024.pdf', category: 'revize', revisionType: 'Hromosvod', date: '2024-04-10', size: '1.5 MB' },
  { id: 9, propertyId: 3, name: 'Stavební povolení.pdf', category: 'technicke', revisionType: null, date: '2019-02-15', size: '8.1 MB' },
  { id: 10, propertyId: 4, name: 'Revizní zpráva - Plyn 2025.pdf', category: 'revize', revisionType: 'Plyn', date: '2025-10-05', size: '2.1 MB' },
  { id: 11, propertyId: 5, name: 'Správcovská smlouva - Ing. Novák.pdf', category: 'smlouvy', revisionType: null, date: '2024-01-15', size: '620 KB' },
  { id: 12, propertyId: 5, name: 'Revizní zpráva - Kotle 2025.pdf', category: 'revize', revisionType: 'Kotle', date: '2025-07-22', size: '1.3 MB' },
  { id: 13, propertyId: 6, name: 'Správcovská smlouva - Bc. Dvořáková.pdf', category: 'smlouvy', revisionType: null, date: '2023-11-01', size: '580 KB' },
  { id: 14, propertyId: 6, name: 'Revizní zpráva - Elektro budovy 2024.pdf', category: 'revize', revisionType: 'Elektro budovy', date: '2024-12-18', size: '3.7 MB' },
];

export const DOC_CATEGORIES = {
  all: 'Vše',
  revize: 'Revize',
  smlouvy: 'Smlouvy',
  pojisteni: 'Pojištění',
  technicke: 'Technické',
  ostatni: 'Ostatní',
};
