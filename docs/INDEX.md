# GrocerAgent Documentation Index (v1 Final)

This is the authoritative index for the GrocerAgent v1 specification.

## Core Documents (Read in this order)

| #  | Document                              | Purpose                                              | Status |
|----|---------------------------------------|------------------------------------------------------|--------|
| 1  | `MASTER_SPECIFICATION.md`             | Single source of truth for the entire v1 system     | Final  |
| 2  | `DATA_MODELS.md`                      | Canonical data structures                            | Final  |
| 3  | `API_REFERENCE.md`                    | Complete list of API endpoints with examples         | Final  |
| 4  | `HERMES_TOOL_SCHEMAS.json`            | Exact tool definitions Hermes should use             | Final  |
| 5  | `HERMES_INTEGRATION.md`               | How Hermes should behave and think                   | Final  |
| 6  | `07-hermes-setup-guide.md`            | Step-by-step guide to connect Hermes                 | Final  |
| 7  | `08-hermes-system-prompt.md`          | Recommended system prompt for Hermes                 | Final  |
| 8  | `04-authentication.md`                | Authentication and authorization model for agents    | Final  |
| 9  | `05-roadmap.md`                       | Phased implementation plan                           | Final  |

## Quick Start for Hermes

If you are configuring Hermes:

1. Read `MASTER_SPECIFICATION.md`
2. Load `HERMES_TOOL_SCHEMAS.json` as tools
3. Use the prompt from `08-hermes-system-prompt.md`
4. Follow `07-hermes-setup-guide.md` for connection steps

## API Implementation Status

API routes are being scaffolded under `app/api/v1/`.

Current status (as of 2026-05-28):
- Folder structure created
- Core route files exist as stubs with TODO comments
- Full implementation will follow this specification

## Contact / Ownership

This specification is owned by Jakub Voskár and is the single source of truth for all GrocerAgent development and Hermes integration work.

---

**Last updated:** 2026-05-28
