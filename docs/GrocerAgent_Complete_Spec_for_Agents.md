# GrocerAgent — Complete Specification for AI Agents (v1.0)

**This is the single-file version of the full specification.**

Optimized for feeding to AI agents (Hermes, OpenClaw, Claude, etc.).

---

## 1. Executive Summary & Vision

GrocerAgent is a shopping list application for a Slovak household (Jakub + Mirka) designed from the ground up to be deeply controlled by AI agents.

**Primary Goal:**
Allow an AI agent (via Telegram or other interfaces) to manage the household shopping list intelligently, suggest items based on promotions from Lunys.sk and Tesco, propose recipes, and eventually help with actual ordering.

**Core Flow:**
- Users (Jakub & Mirka) add items manually via a simple web app.
- They archive the list every Tuesday and Thursday before ordering.
- Hermes (the AI agent) can read the current list, add/remove items, suggest smart additions based on current deals, and prepare the list for ordering.

---

## 2. Architecture Overview

**Target Architecture:**
- Humans interact via Web App (PWA) + future mobile apps.
- AI agents (especially Hermes) interact via a clean, well-documented REST API.
- The API is the single source of truth for all data changes.

**Key Principle:**
Everything important that a human can do in the UI must also be possible for an authorized agent via API.

---

## 3. Data Models (v1)

### Household
```ts
interface Household {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### User
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

### ShoppingList (Active List)
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

### ShoppingItem
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

### ArchivedList
```ts
interface ArchivedList {
  id: string;
  householdId: string;
  archivedAt: Date;
  archivedByUserId: string;
  orderedFrom?: 'Lunys' | 'Tesco' | 'Both' | null;
  notes?: string;
  totalItems: number;
  items: ArchivedItem[];   // immutable snapshot
}
```

### AgentCredential (for Hermes etc.)
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

## 4. API Specification (v1)

**Base Path:** `/api/v1`

### Authentication
All agent requests must include:
```
Authorization: Bearer <api_key>
```

### Core Endpoints

#### GET /list/current
Returns the active shopping list.

#### POST /list/items
Add one or more items.

Example body:
```json
{
  "items": [
    {
      "name": "Krevety mrazené",
      "quantity": 500,
      "unit": "g",
      "category": "Mäso a údeniny",
      "notes": "Na večeru"
    }
  ]
}
```

#### PATCH /list/items/{itemId}
Update an item.

#### DELETE /list/items/{itemId}
Remove an item.

#### POST /list/archive
Archive the current list and create a new empty one.

Recommended body:
```json
{
  "orderedFrom": "Lunys",
  "notes": "Večera s krevetami"
}
```

#### GET /history
List archived lists.

#### GET /history/{id}
Get details of one archived list.

---

## 5. Hermes Tools (Recommended)

Hermes should be given these exact tools:

1. `get_current_shopping_list`
2. `add_items_to_list`
3. `remove_item_from_list`
4. `update_item_in_list`
5. `archive_current_list`
6. `get_recent_archived_lists`

Full JSON schemas are available in `HERMES_TOOL_SCHEMAS.json`.

**Safety Rule:**
- `archive_current_list` should almost always require explicit confirmation from the user.

---

## 6. Recommended System Prompt for Hermes

See the full prompt in `08-hermes-system-prompt.md`.

Key points:
- Respond in Slovak by default.
- Be transparent about every change made to the list.
- Never archive without confirmation (in current phase).
- Understand the Tuesday/Thursday rhythm.

---

## 7. Security & Best Practices

- API keys must be revocable from the web app.
- Every action performed by an agent must be logged.
- Rate limiting is required.
- High-impact actions (archive) should have extra confirmation in the UI.

---

## 8. Current Status (as of 2026-05-28)

- Accounts on Lunys.sk and Tesco Online: **Created**
- Database + Prisma models: **Done**
- Core API endpoints (current list + add items + archive): **Implemented** (basic version)
- Full specification and agent tooling docs: **Complete**

---

**This document (GrocerAgent_Complete_Spec_for_Agents.md) + the files in the `/docs` folder represent the current final specification.**

You can safely give the entire `/docs` folder (or this single file + the JSON schemas) to OpenClaw or Hermes.