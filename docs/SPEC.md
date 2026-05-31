# GrocerAgent - Master Specification

**Project:** GrocerAgent  
**Purpose:** Shared household shopping list system designed to be deeply integrated with AI agents (starting with Hermes).  
**Status:** Active Development  
**Version:** 0.3 (Draft)

---

## 1. Executive Summary

GrocerAgent is a shopping list application for a Slovak couple that will evolve into a hybrid human + AI system.

Short-term goal:
- Excellent manual experience for adding and managing a shared shopping list.
- Clear archiving flow (typically Tuesday + Thursday).

Medium-term goal:
- Hermes (AI agent via Telegram) can read and modify the shopping list through a well-designed API.

Long-term goal:
- The agent can intelligently suggest items based on promotions, help with meal planning, and eventually assist with actual ordering from Lunys and Tesco (with human oversight).

---

## 2. Core Principles

- **Humans first, agents second** — The interface must remain fast and pleasant for manual use.
- **API as first-class citizen** — Everything important must be possible via API.
- **Progressive autonomy** — We start with suggestions and list manipulation, not full autonomous ordering.
- **Transparency & Control** — The agent must be auditable. Humans always have the final say on important actions.
- **Pragmatism** — Prefer simple, working solutions over elegant but complex ones in the beginning.

---

## 3. Key Documents

This specification is supported by the following detailed documents (all in `/docs`):

- `00-overview.md` — High-level vision and architecture
- `01-data-models.md` → `DATA_MODELS.md` — Canonical data structures
- `02-api-design.md` → `API_SPEC.md` — Detailed API contract
- `03-agent-integration.md` → `HERMES_INTEGRATION.md` — How Hermes should behave
- `04-authentication.md` — Security model for agents
- `05-roadmap.md` — Phased implementation plan

---

## 4. Current Priorities (May 2026)

1. Finish creating accounts on Lunys and Tesco (Jakub)
2. Build proper, production-grade documentation and API specification (this folder)
3. Move from localStorage to real database + authentication
4. Implement the API layer according to `API_SPEC.md`
5. Connect Hermes to the new API
6. Significantly improve GrocerBot intelligence and usefulness

---

## 5. Non-Goals (for now)

- Full autonomous ordering and payment without human approval
- Multi-household support (unless it becomes necessary)
- Native mobile apps (PWA first)
- Complex recipe database

---

This master spec should be the single source of truth when making architectural decisions. All other documents are more detailed expansions of specific areas.

Last updated: 2026-05-28 by GrocerBot (based on requirements from Jakub Voskár)
