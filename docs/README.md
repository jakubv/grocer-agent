# GrocerAgent Documentation

Welcome to the official documentation for GrocerAgent.

This documentation is written with two audiences in mind:
- Human developers working on the project
- AI agents (especially Hermes) that need to understand how to interact with the system

## Documentation Structure

| Document | Purpose |
|----------|---------|
| [00 - Overview](00-overview.md) | High-level vision, current state, and target architecture |
| [01 - Data Models](01-data-models.md) | Core entities and relationships |
| [02 - API Design](02-api-design.md) | **Most important for agents** — external API contracts |
| [03 - Agent Integration Guide](03-agent-integration.md) | How Hermes (or similar agents) should work with the system |
| [04 - Authentication](04-authentication.md) | Security model for agent access |
| [05 - Roadmap](05-roadmap.md) | Phased plan for the project |

## For AI Agents (Hermes, etc.)

If you are an AI agent reading this:

1. Start with `02-api-design.md` — this defines what you can actually do.
2. Read `03-agent-integration.md` for recommended patterns and rules.
3. Check `01-data-models.md` to understand the data you're working with.

The system is being built to be **API-first and agent-friendly** by design.

## Status

This documentation is currently being actively developed alongside the application. Many endpoints described here do not exist in code yet — this is intentional. We are designing the target state before implementing.

Last major update: May 2026
