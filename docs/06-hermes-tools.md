# Hermes Tools Specification (v1)

This document defines the exact tools that Hermes should have access to when controlling GrocerAgent.

The goal is to give Hermes a small, clean, powerful set of tools that map 1:1 to the backend API.

---

## Core Principles for Tool Design

- Tools must be **simple and predictable** (LLMs work best with clear, narrow tools).
- Prefer **explicit** over magic (e.g. separate `add_items` and `remove_items` instead of one "modify list" tool).
- Every tool that changes state should be **auditable** (the backend will log who called it and when).
- Destructive actions (especially archiving) should be treated with care.

---

## Tool Definitions

### 1. get_current_list

**Description:**  
Returns the current active shopping list with all items.

**Parameters:** None

**Returns:**
```json
{
  "list_id": "string",
  "items": [
    {
      "id": "string",
      "name": "string",
      "quantity": "number | null",
      "unit": "string | null",
      "category": "string",
      "added_by": "string",      // "Jakub" or "Mirka"
      "added_at": "string (ISO)",
      "notes": "string | null",
      "is_checked": "boolean"
    }
  ],
  "updated_at": "string (ISO)"
}
```

**When Hermes should use it:**
- Almost always at the beginning of a conversation or before making changes.

---

### 2. add_items

**Description:**  
Adds one or more items to the current shopping list.

**Parameters:**
```json
{
  "items": [
    {
      "name": "string (required)",
      "quantity": "number (optional)",
      "unit": "string (optional)",
      "category": "string (optional, recommended)",
      "notes": "string (optional)"
    }
  ]
}
```

**Returns:** The newly created items with their IDs.

**Example call from Hermes:**
```json
{
  "items": [
    { "name": "Krevety mrazené", "quantity": 500, "unit": "g", "category": "Mäso a údeniny", "notes": "Na večeru" },
    { "name": "Citróny", "quantity": 2, "unit": "ks", "category": "Zelenina a ovocie" }
  ]
}
```

---

### 3. remove_item

**Description:**  
Removes a single item from the current list by its ID.

**Parameters:**
```json
{
  "item_id": "string (required)"
}
```

**Note:** For now we remove by ID. Fuzzy removal by name can be added later if needed.

---

### 4. update_item

**Description:**  
Updates an existing item (partial update).

**Parameters:**
```json
{
  "item_id": "string (required)",
  "name": "string (optional)",
  "quantity": "number (optional)",
  "unit": "string (optional)",
  "category": "string (optional)",
  "notes": "string (optional)",
  "is_checked": "boolean (optional)"
}
```

---

### 5. archive_current_list

**Description:**  
Archives the current shopping list and creates a fresh empty one.

**Parameters:**
```json
{
  "ordered_from": "'Lunys' | 'Tesco' | 'Both' | null (optional)",
  "notes": "string (optional)"
}
```

**Important Safety Rule for Hermes:**
- This tool should **almost never** be called without explicit confirmation from the user in the current phase.
- Recommended pattern: "Chceš, aby som archivoval aktuálny zoznam ako objednaný na Lunyse?"

---

### 6. get_archived_lists (optional but useful)

**Description:**  
Returns the most recent archived lists (history).

**Parameters:**
```json
{
  "limit": "number (default 5, max 20)"
}
```

---

### 7. get_archived_list_details (optional)

**Description:**  
Returns full details of one specific archived list.

**Parameters:**
```json
{
  "archived_list_id": "string"
}
```

---

## Recommended Tool Grouping for Hermes

For Hermes configuration, group the tools like this:

**Read-only tools:**
- `get_current_list`
- `get_archived_lists`
- `get_archived_list_details`

**Write tools:**
- `add_items`
- `remove_item`
- `update_item`

**Destructive / High-impact tool:**
- `archive_current_list` (use with extra caution / confirmation)

---

## Future Tools (to design later)

- `suggest_items_from_promotions` (when we have promotion data)
- `generate_recipe_shopping_list`
- `search_items` (fuzzy search in history or catalog)
- `set_list_notes`

---

## Implementation Notes

- All tools should return clear, structured data (not just text).
- The backend must log every call made with an agent API key (who, what tool, parameters, timestamp).
- For the first version, write operations should probably notify both users (push or email) that an agent made a change.

---

**This document should be used directly when configuring tools in Hermes.**