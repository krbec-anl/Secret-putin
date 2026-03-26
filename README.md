# Tajný Putin

Česká satirická politická hra inspirovaná Secret Hitlerem. Pro 6–12 hráčů, každý hraje na svém mobilu v prohlížeči.

## Tech stack

- **Frontend**: React (Vite), deployment na Vercel
- **Backend**: Node.js + Express + Socket.io, deployment na Railway
- **Komunikace**: WebSocket přes Socket.io
- **Databáze**: Žádná – vše v paměti serveru

## Spuštění lokálně

### Server
```bash
cd server
npm install
npm run dev
```
Server běží na `http://localhost:3001`

### Client
```bash
cd client
npm install
npm run dev
```
Klient běží na `http://localhost:5173`

### Environment proměnné (Client)
Vytvořte `.env` soubor v `/client`:
```
VITE_SERVER_URL=http://localhost:3001
```

## Deployment

### Backend (Railway)
1. Vytvořte nový projekt na [Railway](https://railway.app)
2. Připojte GitHub repo, nastavte root directory na `server`
3. Railway automaticky detekuje Node.js a spustí `npm start`

### Frontend (Vercel)
1. Vytvořte nový projekt na [Vercel](https://vercel.com)
2. Připojte GitHub repo, nastavte root directory na `client`
3. Framework preset: Vite
4. Nastavte environment proměnnou:
   - `VITE_SERVER_URL` = URL vašeho Railway serveru

## Pravidla hry

### Frakce
- **Prozápadní frakce** – obránci demokracie
- **Proruská frakce** – loutky Kremlu
- **Putin** – tajný vůdce proruské frakce

### Počty hráčů
| Hráčů | Prozápadní | Proruští | Putin |
|-------|-----------|----------|-------|
| 6     | 4         | 1        | 1     |
| 7     | 4         | 2        | 1     |
| 8–9   | 5         | 2        | 1     |
| 10–11 | 6         | 3        | 1     |
| 12    | 7         | 4        | 1     |

### Výherní podmínky
- **Prozápadní vyhrají**: 5 prozápadních zákonů NEBO poprava Putina
- **Proruští vyhrají**: 6 proruských zákonů NEBO Putin zvolen ministrem po 3+ proruských zákonech

### Postavy
Každý hráč má veřejnou postavu s unikátní jednorázovou schopností:

| Postava | Schopnost |
|---------|-----------|
| Alena Schillerová | Vidí zahozený zákon premiéra |
| Karel Havlíček | Vrátí zahozený zákon do balíčku |
| Filip Turek | Zablokuje hlasování (+1 failcounter) |
| Tomáš Macinka | Nahlédne na 2 vrchní karty |
| Václav Klaus | Vynutí opakování hlasování |
| Petr Fiala | Nominuje 2 kandidáty, hráči volí |
| Generál Pavel | Zablokuje popravu |
| Tomio Okamura | Nominuje sám sebe jako ministra |
| Ivan Bartoš | Dvojitý hlas, pak jedno kolo nemůže hlasovat |
| Danuše Nerudová | Vidí zahozené karty z posledního kola |
| Jan Lipavský | Sníží failcounter o 1 |
| Vít Rakušan | Vidí historii hlasování jednoho hráče |

### Průběh kola
1. **Nominace ministra** – Premiér navrhne kandidáta
2. **Hlasování** – Všichni hlasují veřejně Ano/Ne
3. **Legislativa** – Premiér zahodí 1 ze 3 zákonů, ministr zahodí 1 ze 2, zbývající se přijme
4. **Speciální akce** – Po proruských zákonech: prošetření, zvláštní volby, poprava
5. **Rotace** – Premiér se posouvá doleva

### Balíček zákonů
- 6× Prozápadní zákon
- 11× Proruský zákon
