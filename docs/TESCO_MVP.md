# Tesco MVP — test flow

## What it does

1. Your shopping list (Slovak / your words) → **Tesco search queries** (via Grok if `XAI_API_KEY` is set)
2. You **review** matches on `/tesco`
3. You **approve** → Playwright fills your Tesco cart
4. You **pay & checkout** on Tesco (you stay in control)

## One-time setup (on your Mac)

```bash
cd grokbuild/grocer-agent
# .env must have DATABASE_URL + TURSO_* (same as production) + GA_ACCESS_TOKEN
npm run tesco:login
```

Log in to Tesco in the browser window. Session is saved to the database (works with production DB).

## Daily test

1. Add items on https://nakup.voskar.sk
2. Open **Tesco** tab → **Preložiť zoznam do Tesco**
3. Check lines, skip wrong ones, fix search if needed
4. **Schváliť a naplniť košík** — or if server can't run browser:

```bash
npm run dev   # in one terminal
npm run tesco:approve   # in another
```

5. Tesco opens → verify cart → pay yourself

## Env vars

| Variable | Purpose |
|----------|---------|
| `XAI_API_KEY` | Better product matching |
| `TESCO_ENRICH_SEARCH=true` | Also scrape Tesco prices on prepare (slow, needs session) |
| `GA_ACCESS_TOKEN` | API auth |

## Note

Cart fill uses Playwright — reliable on your Mac / local dev. Vercel serverless may not run the browser; use `npm run tesco:approve` locally against production API if needed.