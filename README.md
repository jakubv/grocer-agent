# GrocerAgent

A shopping list application designed for a Slovak household (Jakub & Mirka), built from the ground up to be deeply integrated with AI agents.

## Current Focus

- Simple, fast shared shopping list between two people
- Tuesday + Thursday archiving flow (before ordering from Lunys / Tesco)
- Chat with **GrocerBot**
- Designed from day one to be fully controllable by external AI agents (especially Hermes via Telegram)

## Documentation (v1 Final)

The complete specification lives in the `docs/` folder.

**Start here:**
- `docs/INDEX.md` — Documentation index
- `docs/MASTER_SPECIFICATION.md` — Single source of truth (read this first)
- `docs/API_REFERENCE.md` — Full API contract
- `docs/HERMES_TOOL_SCHEMAS.json` — Exact tools for Hermes

Other important documents:
- `docs/DATA_MODELS.md`
- `docs/HERMES_INTEGRATION.md`
- `docs/07-hermes-setup-guide.md`
- `docs/08-hermes-system-prompt.md`

## Development

```bash
cp .env.example .env
# Set GA_ACCESS_TOKEN to your household secret
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000 and enter the access token on each phone (saved locally).

**Production:** see `DEPLOY.md`.

## Use today (Jakub & Mirka)

1. Deploy or run `npm run build && npm start` on a server reachable from your phones.
2. Both open the URL in the browser → enter the same **prístupový kód** (`GA_ACCESS_TOKEN`).
3. Pick **Jakub** or **Mirka** in the header — the list syncs every few seconds.
4. **Add to Home Screen** on iPhone/Android for an app-like icon.
5. Tuesday/Thursday: **Archivovať a objednať** → choose Lunys / Tesco / Oboje.

## Long-term Vision

Hermes (or similar agents) should be able to:
- Read and modify the shopping list via a clean API
- Suggest items based on current promotions on Lunys and Tesco
- Help with meal planning and recipes
- Eventually prepare and (with approval) place orders

## Tech Stack (Target)

- Next.js (App Router)
- TypeScript
- PostgreSQL + Prisma/Drizzle
- Clean, agent-friendly API layer (REST + future tRPC)

---

**This project is intentionally built to be agent-first.** All external agents should start from the documentation in `/docs`.