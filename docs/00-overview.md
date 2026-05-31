# GrocerAgent - Project Overview & Architecture

## Vision

GrocerAgent is a purpose-built shopping list application for a Slovak household (Jakub + Mirka) that will eventually be deeply integrated with AI agents.

**Core idea:**
- Simple, fast, and delightful shared shopping list (primary interface for humans).
- Designed from day one to be controllable by external AI agents (especially Hermes via Telegram).
- Long-term goal: The AI agent can read the list, suggest additions based on promotions (Lunys + Tesco), propose recipes, and eventually place orders autonomously or semi-autonomously.

## Current State (as of now)

- The app is a Next.js application.
- Primary feature: Shared shopping list between two people (Jakub & Mirka).
- Users can add items, categorize them, and archive the list (typically on Tuesday and Thursday before ordering).
- There is a basic chat interface with "GrocerBot".
- Authentication and multi-user accounts do **not** exist yet (everything runs locally or with simple localStorage).

## Target Architecture

We are moving toward an **API-first** system with the following layers:

1. **Human Interface** (Web app + future mobile apps)
   - Fast, low-friction shopping list
   - Chat with GrocerBot
   - History of archived lists

2. **Agent Interface (API)**
   - Clean, well-documented REST (or tRPC) API
   - Hermes (and potentially other agents) can call this API to:
     - Read current list
     - Add / remove / update items
     - Archive lists
     - Get promotion-aware suggestions (future)
     - Trigger order preparation (future)

3. **Agent Layer**
   - Hermes running via Telegram
   - Has tools to call the GrocerAgent API
   - Can receive natural language instructions from the user ("Pridaj krevety a urob recept", "Pozri akcie na Lunyse a navrhni večeru")

4. **Future: Action Layer**
   - Ability for the agent to interact with Lunys.sk and Tesco Online (browser automation or APIs)
   - Payment handling via dedicated virtual card

## Guiding Principles

- **Simplicity for humans first** — The app must remain extremely pleasant to use manually.
- **API as first-class citizen** — Every important action must be possible via API.
- **Agent-friendly design** — Endpoints should be predictable, well-documented, and have clear semantics.
- **Gradual autonomy** — We start with planning + suggestions, then move toward execution.
- **Security & Control** — Even when agents have access, the humans stay in control (approvals, limits, visibility).

## Next Major Milestones

1. Proper data persistence (PostgreSQL + Prisma or Drizzle)
2. User accounts + authentication (NextAuth / Better Auth)
3. Clean REST API (or tRPC) with documentation
4. API key / scoped access for Hermes
5. Rich GrocerBot with real tool use (promotions, recipes, list manipulation)
6. Browser automation layer for actual ordering (Lunys + Tesco)

---

This document should be the single source of truth for anyone (especially AI agents) working on or integrating with GrocerAgent.