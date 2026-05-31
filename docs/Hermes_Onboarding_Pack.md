# Hermes Onboarding Pack for GrocerAgent

This is the minimal set of documents you should give to Hermes when connecting it to GrocerAgent.

## Required Documents (give these to Hermes)

1. `GrocerAgent_v1_Final_Specification.md` (this is the master spec)
2. `HERMES_TOOL_SCHEMAS.json` (exact tool definitions with JSON Schema)
3. `08-hermes-system-prompt.md` (recommended system prompt)
4. `07-hermes-setup-guide.md` (how to authenticate and connect)

## Optional but Recommended

- `03-agent-integration.md`
- `API_REFERENCE.md`

## Quick Start for Hermes

1. Read the Master Specification (`GrocerAgent_v1_Final_Specification.md`)
2. Load the tool schemas from `HERMES_TOOL_SCHEMAS.json`
3. Use the system prompt from `08-hermes-system-prompt.md`
4. Ask the user for an API key (generated in the GrocerAgent web app)
5. Start with read-only tools first (`get_current_shopping_list`, `get_recent_archived_lists`)

---

**Goal:** Hermes should become a reliable, safe, and proactive shopping co-pilot for Jakub and Mirka.