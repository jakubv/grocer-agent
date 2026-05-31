# GrocerAgent Roadmap

## Phase 0 — Current (Manual + Basic Chat)
- Simple shared shopping list (Jakub + Mirka)
- Archive functionality (Tuesday / Thursday flow)
- Basic GrocerBot chat (powered by Grok with custom prompt)
- Local storage only

## Phase 1 — API Foundation (Next Priority)
- Proper database (PostgreSQL)
- User accounts + authentication
- Clean REST (or tRPC) API
- API key management for agents
- Hermes can read/write the shopping list via API

## Phase 2 — Rich Agent Capabilities
- GrocerBot gets real tools (can call the API itself)
- Promotion awareness (Lunys + Tesco deals)
- Recipe → Shopping list generation
- Smart suggestions based on current list + deals + preferences

## Phase 3 — Execution Layer (Semi-Autonomous)
- Browser automation (or APIs if available) to pre-fill carts on Lunys and Tesco
- Delivery slot selection
- Human still confirms and pays (or approves payment on dedicated card)

## Phase 4 — Higher Autonomy (Optional)
- Agent can place orders with strong guardrails
- Budget limits, approval workflows, full audit log
- Multi-household support (if useful)

## Phase 5 — Mobile + Polish
- Native iOS and Android apps (or high-quality PWA)
- Better offline support
- Notifications (new items added by partner, order reminders, etc.)

---

**Current Focus Recommendation:**

We are currently between Phase 0 and Phase 1.

**Immediate next steps (recommended order):**

1. Finish documentation (this folder)
2. Move from localStorage to real database + basic auth
3. Build the API layer as described in `02-api-design.md`
4. Create proper API key system
5. Connect Hermes to the new API
6. Significantly improve GrocerBot capabilities using the real API

This sequence gives us the fastest path to having a useful agent (Hermes) that can meaningfully operate the shopping list.