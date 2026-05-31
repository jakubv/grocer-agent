# GrocerAgent — Design Document

**Goal**: Build an AI-powered grocery ordering system for a couple in Prievidza that can autonomously handle weekly + daily grocery orders from **Lunys.sk** and **Tesco Online**, with minimal human intervention.

## Core Philosophy (Based on User Answers)

- **High autonomy desired** ("set it and forget it")
- Agent should be able to place real orders on Lunys and Tesco
- Dedicated virtual card with limits is acceptable
- Post-order oversight via confirmation emails/notifications is the main safety net
- Both partners want visibility
- Some errors are tolerable

## Key Constraints & Risks

- Neither Lunys nor Tesco provide public ordering APIs → **Browser automation is required**
- Full autonomy on payment carries real financial risk
- Website UIs change frequently → automation will be brittle
- Slovak consumer protection + site ToS (automation is usually forbidden)

## Proposed Architecture (2026)

### 1. Layers

| Layer                    | Responsibility                              | Tech                          |
|--------------------------|---------------------------------------------|-------------------------------|
| **Control Panel**        | Preferences, limits, history, overrides     | Next.js 15 (PWA) + Supabase   |
| **AI Agent**             | Planning + Decision making + Execution      | Custom agent (Playwright + LLM) |
| **Safety & Guardrails**  | Spending limits, approvals, monitoring      | Hard-coded + database rules   |
| **Notification System**  | Real-time alerts after every order          | Resend + Push notifications   |
| **Payment**              | Dedicated virtual card                      | Revolut / Stripe Issuing / Bank virtual card |

### 2. High-Level Flow (Autonomous Mode)

1. **Trigger** (cron or manual)
   - Every Sunday evening (weekly shop)
   - Daily at a set time (top-up / daily needs)

2. **Agent gathers context**
   - Recurring items + preferences from DB
   - Recent order history
   - Current budget status
   - Any explicit requests from the couple

3. **Agent plans the order**
   - Decides split between Lunys vs Tesco (or single store)
   - Respects hard limits (per order / weekly)

4. **Agent executes**
   - Uses browser automation to log in and build carts on Lunys and/or Tesco
   - Selects delivery slots
   - Proceeds to payment using the dedicated virtual card

5. **Post-order**
   - Immediately sends detailed notification (email + push) to both users with:
     - Store(s)
     - Total amount
     - Delivery time
     - Link to view / cancel / modify the order
   - Agent logs everything

6. **Human oversight**
   - Users can cancel or modify directly on the eshop after receiving confirmation
   - Future: Add "Emergency stop" button in the app

### 3. Safety Mechanisms (Non-negotiable)

- **Hard spending limits** (stored in database, editable by users):
  - Max per single order (Lunys)
  - Max per single order (Tesco)
  - Max per day
  - Max per week
- Dedicated virtual card with even lower limits (defense in depth)
- Agent must never exceed limits
- Full audit log of every decision and action
- "Human in the loop" mode as fallback (agent only proposes, human approves)

### 4. Data Model (Initial)

- `users` (husband + wife)
- `preferences`
  - Recurring items (with preferred store)
  - Dietary restrictions
  - Favorite brands
- `stores` (Lunys, Tesco)
- `budgets` + `spending_limits`
- `orders` (history)
- `order_items`
- `agent_runs` (logs of what the agent did and why)

### 5. Agent Capabilities (MVP → Advanced)

**MVP (Phase 1)**
- Good planning + list generation
- Manual export to Lunys/Tesco (copy-paste friendly)
- Notifications

**Phase 2**
- Browser automation for cart building (no payment yet)
- Agent fills the cart and selects delivery slot
- Human does final payment

**Phase 3 (Target)**
- Agent completes full order including payment on dedicated card
- Strong limits + monitoring

### 6. Technology Choices

- **Frontend**: Next.js 15 + Tailwind + shadcn/ui (PWA)
- **Backend + Auth**: Supabase (Postgres + Auth + Realtime)
- **Agent**: Playwright + Claude 3.5 Sonnet / GPT-4o (vision) + custom orchestration
- **Scheduling**: Vercel Cron or external scheduler
- **Notifications**: Resend (email) + future push
- **Payment card**: Virtual card from Revolut or similar (manual top-up recommended)

### 7. Risk Mitigation

- Never give the agent access to main bank accounts
- Use a dedicated low-limit virtual card
- Strong logging + ability to review every agent decision
- "Kill switch" in the app
- Regular human review of spending

---

**Next Steps (Execution Plan)**

1. Build the Control Panel (Next.js + Supabase)
2. Design and implement the core data model
3. Build a basic "Agent Runner" that can propose orders
4. Research + prototype browser automation for Lunys and Tesco
5. Implement hard spending limits + notification system
6. Add dedicated card management flow

This document will be updated as we learn more during implementation.