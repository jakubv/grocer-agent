# GrocerAgent - Data Models (v1)

This document defines the canonical data models. These should be the source of truth for both the database schema and the API.

## Core Concepts

- One **Household** = Jakub + Mirka (for now)
- One **active ShoppingList** per household at any time
- **ArchivedList** = immutable snapshot of a list at the moment it was archived

---

## Models

### Household

```ts
interface Household {
  id: string;
  name: string;                    // e.g. "Voskar Household"
  createdAt: Date;
  updatedAt: Date;

  // Future: settings, default stores, etc.
}
```

### User

```ts
interface User {
  id: string;
  householdId: string;
  name: string;                    // "Jakub" or "Mirka"
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
  unit?: string;                   // "ks", "g", "ml", "balenie"...
  category: string;
  addedByUserId: string;           // Who added it
  addedAt: Date;
  notes?: string;
  isChecked: boolean;              // Useful for in-store mode later
}
```

### ArchivedList

```ts
interface ArchivedList {
  id: string;
  householdId: string;
  archivedAt: Date;
  archivedByUserId: string;
  orderedFrom?: 'Lunys' | 'Tesco' | 'Both' | 'Other';
  notes?: string;
  totalItems: number;

  // Snapshot of items at archiving time
  items: ArchivedItem[];
}
```

### ArchivedItem (immutable snapshot)

```ts
interface ArchivedItem {
  name: string;
  quantity?: number;
  unit?: string;
  category: string;
  addedBy: string;                 // Name at time of archiving
  notes?: string;
}
```

### AgentCredential (API Key for Hermes etc.)

```ts
interface AgentCredential {
  id: string;
  householdId: string;
  name: string;                    // e.g. "Hermes - Main"
  keyHash: string;                 // Never store raw key
  scopes: string[];                // e.g. ["list:read", "list:write", "list:archive"]
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
}
```

---

## Important Notes

- `quantity` + `unit` are optional. Many users just write "2x krevety" in the name. We should support both styles.
- `category` is currently free text (with suggested values in UI).
- We treat the active list as a single document for simplicity (good for small households).

---

## Future Extensions (to keep in mind)

- `Recipe`
- `MealPlan`
- `Promotion`
- `Order` (when we start tracking actual orders)
- `StorePreference` per item or per category

This model should be stable enough for Phase 1 and 2 of the project.