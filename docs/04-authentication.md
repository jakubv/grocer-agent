# Authentication & Security for Agent Access

## Goals

- Allow trusted agents (Hermes) to act on behalf of the household.
- Keep full auditability.
- Make it hard for compromised keys to cause major damage.

## Recommended Model

### 1. Household-level API Keys

Each household (Jakub + Mirka) will have one or more API keys.

- Keys are generated in the web app under Settings → Connected Agents.
- Each key has a name (e.g. "Hermes - Main Telegram").
- Keys have granular permissions.

### 2. Permission Scopes (MVP)

- `list:read`
- `list:write`
- `list:archive`
- `history:read`

Later we can add more granular scopes (e.g. `items:delete`, `chat:write`).

### 3. Key Format

Use long, random strings (minimum 32–40 characters), similar to:
`ga_sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

Never expose the raw key in the UI after creation (show it only once).

### 4. Security Best Practices

- Store the key only in the agent's secure environment (never in chat history).
- Rotate keys regularly.
- Support key revocation from the web app.
- Log every API call made with an agent key (who, what, when).

## Alternative / Future Options

- Short-lived tokens + refresh (more complex)
- OAuth2-style flow (overkill for personal use at the beginning)
- Fine-grained per-agent permissions with approval workflows

## Current Recommendation for Hermes

Start simple:
1. One long-lived API key with `list:read + list:write + list:archive`.
2. Store the key in Hermes' secure configuration.
3. Add basic logging on the GrocerAgent side of all actions performed via this key.

This gives us good visibility while keeping implementation effort reasonable.