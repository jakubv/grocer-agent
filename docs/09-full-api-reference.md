# GrocerAgent – Full API Reference (v1 Draft)

**Base Path:** `/api/v1`  
**Authentication:** API Key via `Authorization: Bearer <key>` header  
**Intended Consumers:** Web app + Hermes (and future agents)

---

## 1. Core Concepts

- One active shopping list per household.
- Items can be added, updated, removed, and checked.
- Lists can be archived (this creates an immutable snapshot).
- All write operations performed by an agent should be logged and visible to users.

---

## 2. Endpoints

### 2.1 Current Shopping List

#### GET /list/current

Returns the active shopping list with all items.

**Response 200**
```json
{
  "id": "list_abc123",
  "household_id": "hh_001",
  "status": "active",
  "updated_at": "2026-05-28T14:22:00Z",
  "items": [ ... ]
}
```

#### POST /list/items

Add one or more items.

**Request**
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

#### PATCH /list/items/{item_id}

Update an item (partial).

#### DELETE /list/items/{item_id}

Remove one item.

#### POST /list/archive

Archive the current list and create a new empty one.

**Request (optional)**
```json
{
  "ordered_from": "Lunys",
  "notes": "Večera s krevetami"
}
```

---

### 2.2 History

#### GET /history

List archived lists (most recent first).

**Query params:** `limit`, `offset`

#### GET /history/{id}

Get full details of one archived list.

---

### 2.3 Future Endpoints (Planned)

- `GET /promotions` – Current deals from Lunys + Tesco
- `POST /chat/message` – Send message to GrocerBot
- `GET /suggestions` – Smart suggestions

---

## 3. Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

Common codes:
- `UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `RATE_LIMITED`

---

## 4. Rate Limiting (Recommended)

- 60 requests per minute per API key (soft limit)
- Critical actions (archive) should have stricter limits or additional confirmation in the UI

---

This reference should be turned into an OpenAPI specification in the future.