# Tajný Putin

Česká satirická politická hra inspirovaná Secret Hitlerem. Pro 6–12 hráčů, každý hraje na svém mobilu v prohlížeči.

## Tech stack

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express + Socket.io
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
4. Nastavte PORT environment proměnnou (Railway ji obvykle nastaví automaticky)

### Frontend (Vercel)
1. Vytvořte nový projekt na [Vercel](https://vercel.com)
2. Připojte GitHub repo, nastavte root directory na `client`
3. Framework preset: Vite
4. Nastavte environment proměnnou:
   - `VITE_SERVER_URL` = URL vašeho Railway serveru (např. `https://tajny-putin-server.up.railway.app`)

## Pravidla hry

### Frakce
- **Prozápadní frakce** (liberálové) – obránci demokracie
- **Proruská frakce** (kolaboranti) – loutky Kremlu
- **Putin** – tajný vůdce proruské frakce

### Výherní podmínky
- **Prozápadní vyhraje**: 5 prozápadních zákonů NEBO poprava Putina
- **Proruská vyhraje**: 6 proruských zákonů NEBO Putin zvolen ministrem po 3+ proruských zákonech

### Postavy
Každý hráč má veřejnou postavu s unikátní schopností (jednorázová):

| Postava | Schopnost |
|---------|-----------|
| 💼 Alena Schillerová | Vidí zahozený zákon premiéra |
| 🚂 Karel Havlíček | Vrátí zahozený zákon do balíčku |
| 🔥 Filip Turek | Zablokuje hlasování |
| 🏛️ Tomáš Macinka | Nahlédne na 2 vrchní karty |
| 👴 Václav Klaus | Vynutí opakování hlasování |
| 🤝 Petr Fiala | Nominuje 2 kandidáty |
| ⭐ Generál Pavel | Zablokuje popravu |
| 😤 Tomio Okamura | Nominuje sám sebe |
| 💻 Ivan Bartoš | Dvojitý hlas (pak jedno kolo nemůže) |
| 📊 Danuše Nerudová | Vidí zahozené karty z posledního kola |
| ✈️ Jan Lipavský | Sníží failcounter o 1 |
| 🚔 Vít Rakušan | Vidí historii hlasování hráče |
