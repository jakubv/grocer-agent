# GrocerAgent API Reference (v1)

**Base URL (when deployed):** `https://api.groceragent.sk/v1`  
**Local development:** `http://localhost:3000/api/v1`

All endpoints require authentication via API Key (recommended for agents):

```
Authorization: Bearer <your_api_key>
```

---

## Authentication

- Use long-lived API keys scoped to one household.
- Keys have explicit scopes (e.g. `list:read`, `list:write`, `list:archive`).
- Keys can be created and revoked from the web dashboard.

---

## Shopping List

### Get Current List

**GET** `/list/current`

**Response 200**
```json
{
  "id": "list_abc123",
  "household_id": "hh_001",
  "status": "active",
  "updated_at": "2026-05-28T14:22:00Z",
  "items": [
    {
      "id": "item_001",
      "name": "Krevety mrazené 500g",
      "quantity": 1,
      "unit": "balenie",
      "category": "Mäso a údeniny",
      "added_by": "Jakub",
      "added_at": "2026-05-28T10:12:00Z",
      "notes": "Na večeru",
      "is_checked": false
    }
  ]
}
```

---

### Add Items

**POST** `/list/items`

**Request Body**
```json
{
  "items": [
    {
      "name": "Citróny bio",
      "quantity": 3,
      "unit": "ks",
      "category": "Zelenina a ovocie",
      "notes": "Na krevety"
    }
  ]
}
```

**Response 201** — Returns created items with IDs.

---

### Update Item

**PATCH** `/list/items/{item_id}`

**Request Body (partial)**
```json
{
  "quantity": 2,
  "notes": "Veľké",
  "is_checked": true
}
```

---

### Delete Item

**DELETE** `/list/items/{item_id}`

---

### Archive Current List

**POST** `/list/archive`

**Request Body (optional but recommended)**
```json
{
  "ordered_from": "Lunys",
  "notes": "Večera s krevetami"
}
```

This archives the current list and creates a fresh empty one.

**Important:** Agents should confirm with the user before calling this in most cases.

---

## History

### List Archived Lists

**GET** `/history?limit=10&offset=0`

**Response**
```json
{
  "data": [
    {
      "id": "arch_001",
      "archived_at": "2026-05-25T20:15:00Z",
      "archived_by": "Jakub",
      "ordered_from": "Lunys",
      "total_items": 14,
      "notes": "Večera s krevetami"
    }
  ],
  "meta": {
    "total": 27,
    "limit": 10,
    "offset": 0
  }
}
```

### Get Archived List Details

**GET** `/history/{archived_list_id}`

Returns full details including all items at the time of archiving.

---

## Future Endpoints (Planned)

- `GET /promotions` — Current deals from Lunys + Tesco
- `POST /chat` — Send message to GrocerBot (structured + conversation)
- `GET /suggestions` — Smart suggestions based on list + promotions

---

## Error Format

```json
{
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Item with id 'item_abc' was not found",
    "details": {}
  }
}
```

---

**This document is the contract between GrocerAgent and any external agent (Hermes, future mobile apps, etc.).**