# GrocerAgent — Master Specification (v1.0 Final)

**Project:** GrocerAgent  
**Version:** 1.0  
**Status:** Final  
**Date:** 2026-05-28  
**Authors:** GrocerBot + Jakub Voskár

---

## 1. Vision & Goals

**Primary Goal**  
Create a household shopping system that is excellent for humans to use manually, but is also designed from day one to be deeply operated by AI agents (starting with Hermes via Telegram).

**Core Use Case**  
The user tells Hermes in natural language (via Telegram):
- “Mám chuť na krevety”
- “Pozri akcie na Lunyse a Tescu a navrhni večeru”
- “Archivuj zoznam a objednaj na Lunyse”

Hermes then uses the GrocerAgent API to read the current list, add/remove items intelligently, suggest recipes based on current promotions, and prepare the list for ordering.

**Non-Goals (for v1)**
- Fully autonomous ordering and payment without human oversight
- Multi-household support (unless it becomes necessary)

---

## 2. Guiding Principles

1. **Humans first, agents second**
2. **API as a first-class citizen**
3. **Progressive autonomy with strong guardrails**
4. **Full transparency and auditability**
5. **Pragmatism over over-engineering**

---

## 3. System Architecture (Target)

```
User (Telegram) 
     ↓
Hermes (LLM Agent)
     ↓ (HTTPS + API Key)
GrocerAgent Backend (Next.js + PostgreSQL)
     ↓
Web App (PWA) + Future Mobile Apps
```

---

## 4. Data Models (Canonical v1)

See the full detailed models in `DATA_MODELS.md`.

Key entities:
- Household
- User
- ShoppingList (one active per household)
- ShoppingItem
- ArchivedList (immutable snapshots)
- AgentCredential (API keys for Hermes etc.)

---

## 5. API Design (v1)

**Base Path:** `/api/v1`

### Authentication
- API Key via `Authorization: Bearer <key>`
- Keys are scoped to one household + have explicit permissions (`list:read`, `list:write`, `list:archive`, etc.)

### Core Endpoints (MVP)

**Current List**
- `GET    /list/current`
- `POST   /list/items`
- `PATCH  /list/items/{id}`
- `DELETE /list/items/{id}`
- `POST   /list/archive`

**History**
- `GET /history`
- `GET /history/{id}`

Full detailed specification with request/response examples is in `API_REFERENCE.md`.

---

## 6. Hermes Integration

Hermes should be given the tools defined in `HERMES_TOOL_SCHEMAS.json`.

Recommended system prompt is in `08-hermes-system-prompt.md`.

Detailed behavioral guidelines are in `HERMES_INTEGRATION.md`.

**Critical Safety Rule:**
- `archive_current_list` must almost always require explicit user confirmation.

---

## 7. Security & Operational Requirements

- Every action performed by an agent must be logged (who, what, when, parameters, result).
- Rate limiting per API key.
- All API keys must be revocable from the web dashboard.
- High-impact actions should have additional confirmation flows in the UI.

---

## 8. Implementation Roadmap

**Phase 1 (Current priority)**
- PostgreSQL + Prisma/Drizzle
- User accounts + authentication
- API key management
- Core REST endpoints
- Hermes can read/write the shopping list via API

**Phase 2**
- Rich GrocerBot with real tools
- Promotion awareness
- Smart suggestions

**Phase 3**
- Browser automation layer (pre-fill carts on Lunys/Tesco)
- Human still confirms and pays

**Phase 4 (Optional)**
- Higher autonomy with very strong guardrails

---

## 9. Deliverables Status (as of 2026-05-28)

| Document                          | Status     | Location                              |
|-----------------------------------|------------|---------------------------------------|
| Master Specification              | Final      | `MASTER_SPECIFICATION.md`             |
| Data Models                       | Final      | `DATA_MODELS.md`                      |
| API Reference                     | Final      | `API_REFERENCE.md`                    |
| Hermes Tool Schemas               | Final      | `HERMES_TOOL_SCHEMAS.json`            |
| Hermes Integration Guide          | Final      | `HERMES_INTEGRATION.md`               |
| Hermes Setup Guide                | Final      | `07-hermes-setup-guide.md`            |
| Hermes System Prompt              | Final      | `08-hermes-system-prompt.md`          |
| Hermes Tool Definitions (for agents) | Final   | `06-hermes-tools.md`                  |
| Authentication Model              | Final      | `04-authentication.md`                |
| Roadmap                           | Final      | `05-roadmap.md`                       |

---

This document + the supporting files in `/docs` represent the complete v1 specification for GrocerAgent.

Any future implementation (backend, API, Hermes tools) should be driven by these documents.

---

**End of Master Specification v1.0**