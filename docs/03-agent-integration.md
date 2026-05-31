# Agent Integration Guide (Hermes + Telegram)

This document explains how an external AI agent (Hermes) should interact with GrocerAgent.

## Philosophy

The GrocerAgent system is designed so that a capable LLM agent can **read and modify** the user's shopping data through a clean API, while the human users keep full visibility and control through the normal web interface.

## Current Recommended Integration Pattern

### 1. Authentication

Hermes should authenticate using a long-lived **API Key** scoped to the household.

- The key should have limited permissions (start with `list:read` + `list:write` + `list:archive`).
- Never hardcode the key in prompts. Pass it securely to the agent at runtime.

### 2. Primary Tools Hermes Should Have

Hermes should be given these core tools (these will map 1:1 to API endpoints):

| Tool Name                    | Description                                      | Example Use Case |
|-----------------------------|--------------------------------------------------|------------------|
| `get_current_list`          | Returns all items in the active shopping list   | "What's currently on our list?" |
| `add_items`                 | Add one or multiple items to the list           | "Pridaj 500g kreviet a 2 citróny" |
| `remove_items`              | Remove items by ID or by name (fuzzy)           | "Zmaž to mlieko čo som pridal včera" |
| `update_item`               | Change quantity, notes, category, etc.          | "Zmeň množstvo banánov na 6" |
| `archive_list`              | Archive current list (usually before ordering)  | "Archivuj zoznam a označ že išiel na Lunys" |
| `get_recent_archived_lists` | See what was bought in previous cycles          | "Čo sme kupovali minulý týždeň?" |
| `get_list_history`          | Full history of archived lists                  | Analysis & pattern detection |

### 3. Communication Flow (Recommended)

**Best pattern today:**

1. User writes to Hermes on Telegram (natural language).
2. Hermes decides what to do.
3. Hermes calls the GrocerAgent API (using tools).
4. Hermes reports back to the user what it did (or proposes changes).

Example conversation:

**User:** "Mám chuť na krevety dnes večer"

**Hermes (internally):**
- Calls `get_current_list`
- Thinks about a good recipe
- Calls `add_items` with relevant ingredients
- Replies to user with the plan + what it added

### 4. Important Rules for Hermes

- **Always confirm before archiving** the list (unless the user explicitly says "archivuj").
- Prefer **adding** over **replacing** unless asked.
- When the user is vague ("niečo dobré na večeru"), ask for preferences or make a reasonable proposal.
- Keep track of what was recently added so you don't duplicate items unnecessarily.
- Be transparent: Tell the user what actions you performed on their list.

### 5. Future Capabilities (to design for)

- Ability to read current promotions (from Lunys + Tesco)
- Smart suggestions based on deals + current list + household preferences
- Recipe → Shopping list generation
- "What can I cook with what I already have + what's cheap right now?"

## Technical Recommendations

### API Style

- Start with a clean **REST API** (easier for agents to use than GraphQL in most cases).
- Consider adding **tRPC** later for type-safe calls if Hermes runs in a TypeScript environment.
- Use clear, intention-revealing endpoint names.

### Context for the Agent

When giving Hermes context, always include:
- Current shopping list
- Last 2–3 archived lists (so it understands household patterns)
- Household members (Jakub + Mirka)
- Any known preferences or dietary restrictions

### Rate Limiting & Safety

- The API should have reasonable rate limits.
- Critical actions (especially `archive_list`) should be rate-limited more aggressively or require confirmation in the first versions.

## Example Tool Schema (for Hermes)

```json
{
  "name": "add_items",
  "description": "Add one or more items to the current shopping list",
  "parameters": {
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "quantity": { "type": "number" },
            "unit": { "type": "string" },
            "category": { "type": "string" },
            "notes": { "type": "string" }
          },
          "required": ["name"]
        }
      }
    },
    "required": ["items"]
  }
}
```

## Open Questions

- Should Hermes be allowed to archive the list autonomously, or should it always propose it first?
- How do we handle conflicting instructions from Jakub vs Mirka?
- Do we want a "dry-run" / proposal mode for the agent ("Navrhujem pridať tieto veci...")?

---

This document should evolve together with the actual API implementation.