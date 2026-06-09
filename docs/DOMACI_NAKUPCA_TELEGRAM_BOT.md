# Domáci Nákupca Telegram bot

Domáci Nákupca is the family-shopping Telegram bot for Jakub and Mirka. It is separate from the older `Nákupca` MVP bot and is intended to manage the household list plus prepare Tesco/Lunys orders.

## Webhook endpoint

```text
POST https://nakup.voskar.sk/api/v1/telegram/domaci-nakupca
```

Health check:

```bash
curl https://nakup.voskar.sk/api/v1/telegram/domaci-nakupca
```

## BotFather setup

Create a new bot with BotFather:

```text
/newbot
Domáci Nákupca
```

Bot username must end in `bot`, for example:

```text
DomaciNakupcaBot
voskar_domaci_nakupca_bot
```

Add production secrets:

```env
DOMACI_NAKUPCA_TELEGRAM_BOT_TOKEN="token_from_botfather"
DOMACI_NAKUPCA_TELEGRAM_WEBHOOK_SECRET="long-random-secret"
```

Register webhook:

```bash
curl -X POST "https://api.telegram.org/bot$DOMACI_NAKUPCA_TELEGRAM_BOT_TOKEN/setWebhook" \
  -H 'Content-Type: application/json' \
  -d "{
    \"url\": \"https://nakup.voskar.sk/api/v1/telegram/domaci-nakupca\",
    \"secret_token\": \"$DOMACI_NAKUPCA_TELEGRAM_WEBHOOK_SECRET\",
    \"allowed_updates\": [\"message\"]
  }"
```

## Commands

```text
/start
/help
/zoznam
/pridaj mlieko, banány, toaletný papier
/zmaz mlieko
/kupene mlieko
/objednavka
/zdroje
```

Natural Slovak messages are also supported for the most common intents:

```text
pridaj banány a grécky jogurt
čo treba kúpiť?
priprav objednávku
```

## Google Keep integration reality

Google Keep does not provide a stable official public server API for a production bot. Sharing a Keep note with a bot does not automatically give the backend readable API access.

Recommended production bridge:

1. Keep the current Google Keep checklist for Jakub + Mirka if that is the preferred mobile UI.
2. Add Google Apps Script / automation that mirrors the Keep checklist into a Google Sheet.
3. Configure the bot against the Sheet ID:

```env
DOMACI_NAKUPCA_GOOGLE_KEEP_NOTE_URL="https://keep.google.com/..."
DOMACI_NAKUPCA_GOOGLE_SHEET_ID="spreadsheet_id"
```

Alternative: make Google Sheets the canonical shared list and use Telegram + web UI as the user interfaces.

## Tesco/Lunys credentials

Never paste credentials into GitHub, docs, or Telegram chat history. Put them only into hosting secrets:

```env
DOMACI_NAKUPCA_TESCO_USERNAME=""
DOMACI_NAKUPCA_TESCO_PASSWORD=""
DOMACI_NAKUPCA_LUNYS_USERNAME=""
DOMACI_NAKUPCA_LUNYS_PASSWORD=""
```

The MVP intentionally prepares an order draft only. Automated login, basket filling, and checkout should be implemented with these guardrails:

- no payment without explicit confirmation from Jakub/Mirka,
- price and substitution summary before checkout,
- per-order spending limit,
- audit log of what was added/removed,
- manual handoff for CAPTCHA/2FA,
- isolated portal credentials and ideally a dedicated payment card.

## Current implementation status

Implemented now:

- webhook endpoint,
- Telegram command handling,
- shared active list backed by the existing Prisma shopping-list models,
- category inference,
- bought/delete actions,
- Tesco/Lunys order draft split.

Not implemented yet:

- reliable Google Keep/Sheets sync,
- Tesco/Lunys browser automation,
- checkout/ordering.
