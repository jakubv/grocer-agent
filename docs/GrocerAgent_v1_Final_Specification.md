# GrocerAgent v1 — Final Specification

**Project:** GrocerAgent  
**Version:** 1.0 (Final)  
**Date:** 2026-05-28  
**Status:** Definitive Specification  
**Authors:** GrocerBot + Jakub Voskár

---

## 1. Executive Summary

GrocerAgent is a modern, agent-first grocery shopping list application designed for a Slovak household (Jakub + Mirka).

**Core Vision:**
- Provide an excellent, low-friction experience for humans to manage a shared shopping list.
- Be deeply controllable by AI agents (starting with Hermes via Telegram).
- Enable a "set it and forget it" flow where the user gives natural language instructions and the agent handles the rest (within safe boundaries).

**Primary Use Case:**
The user tells Hermes via Telegram things like:
- "Mám chuť na krevety"
- "Pozri akcie na Lunyse a Tescu a navrhni večeru"
- "Archivuj zoznam a objednaj na Lunyse"

Hermes then uses the GrocerAgent API to read the current list, add/remove items, suggest recipes based on promotions, and prepare the list for ordering.

---

## 2. Guiding Principles

1. **Humans first, agents second** — The web/mobile experience must remain excellent even without any agent.
2. **API as a first-class citizen** — Everything important must be possible via a clean, well-documented API.
3. **Progressive Autonomy** — Start with suggestions and list manipulation. Move toward execution only with strong guardrails.
4. **Safety & Auditability** — Every action performed by an agent must be logged and visible to the users.
5. **Pragmatism over Perfection** — Prefer simple, working solutions that can evolve.

---

## 3. System Architecture (Target)

```
┌─────────────────────┐
│   Telegram (User)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│      Hermes         │  ← LLM Agent (Claude / GPT / local)
│  (Tool Calling)     │
└──────────┬──────────┘
           │ HTTPS + API Key
           ▼
┌─────────────────────┐
│  GrocerAgent API    │  ← Next.js + tRPC / REST + PostgreSQL
│  (v1)               │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐   ┌────────────┐
│  Web   │   │  Future    │
│  App   │   │  Mobile    │
│ (PWA)  │   │  Apps      │
└────────┘   └────────────┘
```

---

## 4. Data Models (Canonical)

### 4.1 Household
```ts
interface Household {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 User
```ts
interface User {
  id: string;
  householdId: string;
  name: string;           // "Jakub" or "Mirka"
  email: string;
  role: 'owner' | 'member';
  createdAt: Date;
}
```

### 4.3 ShoppingList (Active)
```ts
interface ShoppingList {
  id: string;
  householdId: string;
  status: 'active';
  createdAt: Date;
  updatedAt: Date;
  items: ShoppingItem[];
}
```

### 4.4 ShoppingItem
```ts
interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: string;
  addedByUserId: string;
  addedAt: Date;
  notes?: string;
  isChecked: boolean;
}
```

### 4.5 ArchivedList
```ts
interface ArchivedList {
  id: string;
  householdId: string;
  archivedAt: Date;
  archivedByUserId: string;
  orderedFrom?: 'Lunys' | 'Tesco' | 'Both' | null;
  notes?: string;
  totalItems: number;
  items: ArchivedItem[];   // snapshot
}
```

### 4.6 AgentCredential
```ts
interface AgentCredential {
  id: string;
  householdId: string;
  name: string;
  keyHash: string;
  scopes: string[];           // e.g. ["list:read", "list:write", "list:archive"]
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
}
```

---

## 5. API Specification (v1)

**Base Path:** `/api/v1`

### Authentication
- Header: `Authorization: Bearer <api_key>`
- API keys are scoped to one household and have explicit permissions.

### Core Endpoints

#### Current List
- `GET    /list/current`
- `POST   /list/items`          (bulk add)
- `PATCH  /list/items/{id}`
- `DELETE /list/items/{id}`
- `POST   /list/archive`

#### History
- `GET /history`
- `GET /history/{id}`

#### Future
- `GET /promotions`
- `POST /chat`

**Full detailed request/response schemas** are defined in `docs/API_REFERENCE.md`.

---

## 6. Hermes Tool Definitions (Recommended)

Hermes should be given the following tools (see `docs/06-hermes-tools.md` and `docs/HERMES_TOOL_SCHEMAS.json` for full schemas):

1. `get_current_shopping_list`
2. `add_items_to_list`
3. `remove_item_from_list`
4. `update_item_in_list`
5. `archive_current_list`
6. `get_recent_archived_lists`

**Critical Safety Rule:**
- `archive_current_list` should almost always require explicit user confirmation before being called.

---

## 7. Security & Operational Requirements

- All agent actions must be logged with: timestamp, agent ID, action, parameters, result.
- Rate limiting per API key (recommended: 60 req/min soft limit).
- Critical actions (archive) should have additional confirmation flows in the UI.
- API keys must be revocable from the dashboard.
- All write operations performed by agents should notify both users (push/email).

---

## 8. Phased Implementation Roadmap

**Phase 0** (Current)
- Manual shopping list + basic chat

**Phase 1** (Next 2–4 weeks)
- PostgreSQL + Prisma/Drizzle
- User accounts + authentication
- API key system
- Core REST endpoints (`/list/*`, `/history`)
- Hermes can read + write the list via API

**Phase 2**
- Rich GrocerBot with real tools
- Promotion awareness (Lunys + Tesco)
- Smart suggestions

**Phase 3**
- Browser automation layer (pre-fill carts on Lunys/Tesco)
- Human still confirms + pays

**Phase 4** (Optional)
- Higher autonomy with strong guardrails (dedicated card, limits, multi-step approval)

---

## 9. Non-Functional Requirements

- The web app must remain fast and pleasant even if no agent is used.
- API must be well documented (OpenAPI + human-friendly docs).
- The system must be auditable — users must always see what the agent did.
- Mobile experience is important (PWA first, native apps later).

---

## 10. Open Questions (to be decided later)

- Should we support optimistic "propose changes" mode for agents?
- How to handle conflicting instructions from Jakub vs Mirka?
- Exact strategy for scraping promotions from Lunys and Tesco (legal + technical).
- When (if ever) we allow the agent to complete orders autonomously.

---

**This document is the single source of truth for the GrocerAgent v1 system.**

All other documents in `/docs` are supporting materials that expand on specific areas of this specification.

---

*Final Version – 2026-05-28*