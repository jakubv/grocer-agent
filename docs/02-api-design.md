# API Design

This document defines the external API that AI agents (especially Hermes) will use to interact with GrocerAgent.

**Goal**: Make the API predictable, well-documented, and easy to use by LLM-based agents.

## Base URL (Future)

When the app is deployed:

```
https://api.groceragent.sk/v1
```

For local development:

```
http://localhost:3000/api/v1
```

## Authentication

Two main methods will be supported:

1. **API Key** (recommended for agents like Hermes)
   - Header: `Authorization: Bearer <api_key>`
   - Keys are scoped to a household and have specific permissions.

2. **Session Cookie / JWT** (for the web app itself)

### Permissions (for API keys)

- `list:read`
- `list:write`
- `list:archive`
- `history:read`
- `chat:write` (future)

## Core Endpoints

### Current Shopping List

#### Get Current List
```http
GET /api/v1/list/current
```

**Response:**
```json
{
  "id": "list_abc123",
  "items": [
    {
      "id": "item_001",
      "name": "Krevety mrazené 500g",
      "quantity": 1,
      "unit": "balenie",
      "category": "Mäso a údeniny",
      "addedBy": "Jakub",
      "addedAt": "2026-05-28T10:12:00Z",
      "notes": null,
      "isChecked": false
    }
  ],
  "updatedAt": "2026-05-28T14:30:00Z"
}
```

#### Add Item(s)
```http
POST /api/v1/list/items
```

**Body:**
```json
{
  "items": [
    {
      "name": "Citróny",
      "quantity": 3,
      "unit": "ks",
      "category": "Zelenina a ovocie",
      "notes": "Na krevety"
    }
  ]
}
```

**Response:** `201 Created` + the created items

#### Remove Item
```http
DELETE /api/v1/list/items/{itemId}
```

#### Update Item
```http
PATCH /api/v1/list/items/{itemId}
```

**Body (partial):**
```json
{
  "quantity": 2,
  "notes": "Veľké"
}
```

#### Archive Current List
```http
POST /api/v1/list/archive
```

**Body (optional):**
```json
{
  "orderedFrom": "Lunys",
  "notes": "Prvá testovacia objednávka"
}
```

This moves the current list into history and creates a fresh empty list.

---

### History

#### List Archived Lists
```http
GET /api/v1/history
```

Query params: `limit`, `offset`

#### Get Specific Archived List
```http
GET /api/v1/history/{archivedListId}
```

---

### Chat / GrocerBot (Future)

```http
POST /api/v1/chat
```

This endpoint will allow agents to have a conversation with GrocerBot while giving it structured access to the current list.

---

## Design Principles for the API

1. **Idempotency where it makes sense** (especially for adding items).
2. **Clear error messages** (agents need to understand what went wrong).
3. **Consistent naming** (use `camelCase` in JSON).
4. **Minimal nesting** — keep responses flat when possible.
5. **Support bulk operations** (add multiple items at once).
6. **Version the API** from day one (`/v1/`).

## Recommended Tech Stack (for API)

- **Next.js App Router** (`app/api/v1/...`)
- **tRPC** (strongly recommended) or clean REST with Zod validation
- **Prisma** or **Drizzle** ORM
- **PostgreSQL**
- **Authentication**: Lucia Auth / Better-Auth + API keys table

## Error Format (Example)

```json
{
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Item with id 'item_xyz' does not exist in the current list",
    "details": {}
  }
}
```

## Next Steps

- [ ] Define full OpenAPI / tRPC router contract
- [ ] Implement authentication + API key management
- [ ] Add rate limiting (important for agents)
- [ ] Create SDK (TypeScript) for easier agent integration

This API should become the single source of truth for any external system (Hermes, future mobile apps, automations, etc.).