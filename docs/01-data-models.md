# Data Models

This document defines the core data structures for GrocerAgent. These models should be respected both in the database and in the API.

## Core Entities

### User

```ts
interface User {
  id: string;
  name: string;           // "Jakub" or "Mirka"
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ShoppingList (Current Active List)

One active list per household (for now we treat it as single household with two members).

```ts
interface ShoppingList {
  id: string;
  householdId: string;
  status: 'active' | 'archived';
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
  unit?: string;                    // "ks", "kg", "l", etc.
  category: string;                 // "Zelenina a ovocie", "Mliečne výrobky", etc.
  addedByUserId: string;            // Who added it (Jakub or Mirka)
  addedAt: Date;
  notes?: string;
  isChecked: boolean;               // For in-store checking later
}
```

### ArchivedList

```ts
interface ArchivedList {
  id: string;
  householdId: string;
  archivedAt: Date;
  archivedByUserId: string;
  items: ArchivedShoppingItem[];
  totalItems: number;
  orderedFrom?: 'Lunys' | 'Tesco' | 'Both' | 'Other';
  notes?: string;
}
```

### ArchivedShoppingItem (snapshot)

```ts
interface ArchivedShoppingItem {
  name: string;
  quantity?: number;
  unit?: string;
  category: string;
  addedBy: string;                  // Name at time of archiving
  notes?: string;
}
```

## Future / Extended Models

### Household (when we support multiple households)

```ts
interface Household {
  id: string;
  name: string;
  createdAt: Date;
}
```

### AgentSession / API Key (for Hermes integration)

```ts
interface AgentCredential {
  id: string;
  householdId: string;
  name: string;                     // e.g. "Hermes - Telegram"
  type: 'api_key' | 'oauth';
  keyHash: string;                  // Never store raw key
  permissions: string[];            // e.g. ["list:read", "list:write", "archive"]
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
}
```

### Promotion / Deal (future)

```ts
interface Promotion {
  id: string;
  store: 'Lunys' | 'Tesco';
  productName: string;
  price?: number;
  validUntil?: Date;
  url?: string;
  scrapedAt: Date;
}
```

## Important Design Decisions

- One active shopping list per household (simplicity).
- Archived lists are immutable snapshots.
- Every item records who added it (useful for both humans and agents).
- Categories are free-text for now (with suggested values in the UI).
- We will need proper relational database (PostgreSQL) once we move beyond localStorage.

## Next Steps for Models

- [ ] Add `householdId` properly once multi-household support is needed
- [ ] Decide on quantity vs free-text amount (many people just write "2x" in name)
- [ ] Add soft delete / undo capability for items
- [ ] Consider price tracking per item (optional)