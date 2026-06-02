# GrocerAgent — Deploy (today)

## Quick start (local)

```bash
cp .env.example .env
# Edit GA_ACCESS_TOKEN to your household secret
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000 — enter the same `GA_ACCESS_TOKEN` on Jakub's and Mirka's phones.

## Mobile (Add to Home Screen)

1. Open the site in Safari (iOS) or Chrome (Android).
2. Share → **Add to Home Screen**.
3. Enter the access code once; it stays saved.

Lists sync every ~4 seconds between devices.

## Recommended: Vercel (fastest for shared hosting)

Websupport shared hosting usually does not run Node.js apps. For **today**, Vercel + your domain DNS is the fastest path:

1. Push repo to GitHub (already at `jakubv/grocer-agent`).
2. Import project on [vercel.com](https://vercel.com).
3. Environment variables:
   - `DATABASE_URL` — use [Turso](https://turso.tech) libsql URL **or** Vercel Postgres **or** keep SQLite only on a VPS (not ideal on Vercel serverless).
   - `GA_ACCESS_TOKEN` — your household secret.
   - `XAI_API_KEY` (optional) — for GrocerBot.
4. For **SQLite on a single VPS** (e.g. Websupport VPS if you have one):
   - `DATABASE_URL="file:/var/www/grocer-agent/prisma/prod.db"`
   - `npm run build && npm start` behind nginx.

## Websupport

If you only have **classic shared hosting** (PHP only), use **Vercel** or a small VPS for the Next.js app and point a subdomain (e.g. `nakup.vasadomena.sk`) via CNAME to Vercel.

## Custom domain: nakup.voskar.sk

**Live now (no DNS needed):** https://grocer-agent.vercel.app

`voskar.sk` uses Websupport nameservers. Add this record in Websupport DNS (or run `npm run dns:setup` with API keys):

| Type | Name  | Value        |
|------|-------|--------------|
| A    | nakup | 76.76.21.21  |

API keys: [websupport.sk → API keys](https://www.websupport.sk/podpora/kb/api-keys/) → then:

```bash
export WEBSUPPORT_API_KEY="..."
export WEBSUPPORT_SECRET="..."
npm run dns:setup
```

`groceragent.sk` is **not registered** — use `nakup.voskar.sk` or the `.vercel.app` URL.