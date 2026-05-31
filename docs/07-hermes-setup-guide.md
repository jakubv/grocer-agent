# Hermes Setup Guide – Connecting to GrocerAgent

This guide explains step-by-step how to connect Hermes (your Telegram agent) to the GrocerAgent system via API.

## 1. Prerequisites

- You have created accounts on Lunys.sk and Tesco Online.
- The GrocerAgent web application is running (at least locally for now).
- You have access to the GrocerAgent web dashboard (to generate API keys).

## 2. Generate an API Key for Hermes

1. Log into the GrocerAgent web app.
2. Go to **Settings → Connected Agents** (or similar section).
3. Click **"Create new API Key"**.
4. Give it a clear name, e.g.:
   - `Hermes - Main Telegram Bot`
5. Select the required scopes (minimum recommended):
   - `list:read`
   - `list:write`
   - `list:archive`
6. Copy the key **immediately** (it will only be shown once).

Store this key securely (e.g. in your password manager or in Hermes' secure configuration).

**Never** put the raw API key into chat history or prompts.

## 3. Give Hermes the Right Tools

Hermes should be configured with the tools defined in:

- `docs/06-hermes-tools.md`
- `docs/HERMES_TOOL_SCHEMAS.json`

You can copy the JSON schemas directly into Hermes' tool configuration.

Recommended minimal tool set for v1:

- `get_current_shopping_list`
- `add_items_to_list`
- `remove_item_from_list`
- `update_item_in_list`
- `archive_current_list`
- `get_recent_archived_lists`

## 4. System Prompt for Hermes (Recommended)

Use a prompt similar to this (customize as needed):

```
You are Hermes, a helpful and precise shopping assistant for Jakub and Mirka.

You have access to their shared shopping list through the GrocerAgent API.

Your job is to help them manage the list, suggest smart additions based on promotions, and prepare orders for Lunys and Tesco.

Rules:
- Always be transparent about what actions you perform on the list.
- For destructive actions (especially archiving the list), ask for explicit confirmation first.
- Prefer adding items over removing them unless the user is very clear.
- When the user mentions a meal idea or craving, propose a small, realistic shopping list and optionally a simple recipe.
- You can read current promotions (when the feature is available) and suggest high-value items.
- Respond in Slovak by default.

You have the following tools available: [list the tools here]
```

## 5. Security Best Practices

- Use the most narrow set of scopes possible.
- Rotate the API key every few months.
- Monitor the "Last used" timestamp in the dashboard.
- Log every action Hermes performs (the backend should do this automatically).
- Consider adding a confirmation step in the web app for high-impact actions (e.g. "Hermes wants to archive the list – confirm?").

## 6. Testing the Connection

Good first tests with Hermes:

1. "Aké mám momentálne veci na zozname?" → should call `get_current_shopping_list`
2. "Pridaj 500g kreviet a 2 citróny" → should call `add_items_to_list`
3. "Zmaž poslednú položku" → should call `remove_item_from_list` (after clarification)

## 7. Next Steps After Basic Connection

Once basic list manipulation works, you can gradually give Hermes more power:

- Read archived lists (history)
- Later: Read promotions and make smart suggestions
- Much later: Prepare full orders for approval

---

**Document version:** 0.1  
**Last updated:** 2026-05-28

This guide should be given to Hermes together with the tool schemas and API reference.