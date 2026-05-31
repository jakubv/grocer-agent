# GrocerAgent API Specification v1

**Status:** Draft / In Progress  
**Version:** 0.2  
**Date:** 2026-05-28  
**Owner:** Jakub Voskár + GrocerBot Team

---

## 1. Goals & Principles

The API is designed with the following priorities:

- **Agent-first design** — The primary consumer will initially be Hermes (via Telegram).
- **Simplicity + Predictability** — Endpoints must be obvious for an LLM to use correctly.
- **Safety** — Critical actions (especially archiving and future ordering) must be explicit and auditable.
- **Extensibility** — Must support future features (promotions, recipes, automatic ordering, multi-household).

---

## 2. Authentication

### 2.1 API Keys (for Agents)

Hermes and other agents will authenticate using **long-lived API keys**.

**Header:**
```
Authorization: Bearer ga_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Key properties:**
- Scoped to one `householdId`
- Have explicit permissions (see below)
- Can be revoked at any time from the web dashboard

### 2.2 Permissions (Scopes)

Current minimal set:

| Scope            | Description                              | Required for Hermes? |
|------------------|------------------------------------------|----------------------|
| `list:read`      | Read current and archived lists          | Yes                  |
| `list:write`     | Add, update, delete items                | Yes                  |
| `list:archive`   | Archive the current list                 | Yes (with caution)   |
| `history:read`   | Read archived lists                      | Recommended          |
| `chat:write`     | Send messages as GrocerBot (future)      | Later                |

### 2.3 Future Authentication Methods

- Short-lived JWTs for the web app
- OAuth2 (if we ever support third-party apps)

---

## 3. Base URL

**Production:**
```
https://api.groceragent.sk/v1
```

**Local development:**
```
http://localhost:3000/api/v1
```

All endpoints are versioned under `/v1`.

---

## 4. Data Models (Summary)

See full models in `01-data-models.md`. Key entities for the API:

- `Household`
- `ShoppingList` (one active per household)
- `ShoppingItem`
- `ArchivedList`
- `AgentCredential` (API keys)

---

## 5. Core API Endpoints

### 5.1 Current Shopping List

#### GET /list/current

Returns the active shopping list for the authenticated household.

**Response 200:**
```json
{
  "id": "list_abc123",
  "householdId": "household_001",
  "status": "active",
  "updatedAt": "2026-05-28T14:22:00Z",
  "items": [
    {
      "id": "item_001",
      "name": "Krevety mrazené 500g",
      "quantity": 1,
      "unit": "balenie",
      "category": "Mäso a údeniny",
      "addedBy": "Jakub",
      "addedAt": "2026-05-28T10:12:00Z",
      "notes": "Na večeru",
      "isChecked": false
    }
  ]
}
```

#### POST /list/items

Add one or more items.

**Request Body:**
```json
{
  "items": [
    {
      "name": "Citróny bio",
      "quantity": 4,
      "unit": "ks",
      "category": "Zelenina a ovocie",
      "notes": "Na krevety"
    }
  ]
}
```

#### DELETE /list/items/{itemId}

Remove a specific item.

#### PATCH /list/items/{itemId}

Update an item (partial update supported).

#### POST /list/archive

Archive the current list and create a new empty one.

**Request Body (recommended):**
```json
{
  "orderedFrom": "Lunys",
  "notes": "Večera s krevetami"
}
```

**Important:** This action should be treated with care by agents.

---

### 5.2 History

#### GET /history

List archived lists (most recent first).

**Query Parameters:**
- `limit` (default 10, max 50)
- `offset`

#### GET /history/{archivedListId}

Get full details of one archived list.

---

### 5.3 Household (Future)

```http
GET /household
PATCH /household
```

(For now we can hardcode one household.)

---

## 6. Error Handling

All errors should return a consistent structure:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Item name cannot be empty",
    "details": {}
  }
}
```

Common error codes:
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `RATE_LIMITED`

---

## 7. Rate Limiting

- Agents should be rate limited (e.g. 60 requests/minute per key).
- Critical actions (`archive`) should have stricter limits or additional confirmation flows in early versions.

---

## 8. Recommended Tool Definitions for Hermes

Hermes should be given the following tools (these map directly to the API above):

- `get_current_shopping_list`
- `add_items_to_list`
- `remove_item_from_list`
- `update_item_in_list`
- `archive_current_list`
- `get_archived_lists`
- `get_archived_list_details`

Each tool should have clear descriptions and strict schemas.

---

## 9. Security & Best Practices for Agents

- Never store raw API keys in chat history or prompts.
- Prefer the most narrow permission set possible.
- Log every action the agent performs on the list.
- For destructive actions (archive), require explicit user confirmation in the first versions.

---

## 10. Open Questions & Future Work

- Should we support optimistic "propose changes" before applying them?
- How do we handle conflicts when both humans and the agent edit the list at the same time?
- Promotion scraping strategy (Lunys + Tesco).
- When do we introduce the ability for the agent to actually place orders?

---

**This document should be treated as the contract between the GrocerAgent backend and any AI agent (Hermes) that wants to control it.**