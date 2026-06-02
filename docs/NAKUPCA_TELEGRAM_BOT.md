# Nákupca Telegram Bot

Standalone Telegram bot for GrocerAgent. It is designed for `https://nakup.voskar.sk` and works directly with the GrocerAgent database/API model.

## MVP capabilities

- `/start` or `/help` — help text
- `/zoznam` — show active shopping list
- `/pridaj mlieko, banány, toaletný papier` — add multiple items
- `/zmaz mlieko` — remove first matching item by name
- `/navrhni krevety` — add a prepared meal bundle
- `/archivuj` — archive current list and create a new one

Natural messages also work for the most common cases:

- `pridaj banány a grécky jogurt`
- `mám chuť na krevety`
- `čo je v zozname?`

## Environment variables

```env
NAKUPCA_TELEGRAM_BOT_TOKEN="123456:botfather-token"
NAKUPCA_TELEGRAM_WEBHOOK_SECRET="long-random-secret"
DATABASE_URL="file:/var/lib/grocer-agent/prod.db"
```

`NAKUPCA_TELEGRAM_WEBHOOK_SECRET` is optional in development but should be set in production.

## Webhook endpoint

```text
POST https://nakup.voskar.sk/api/v1/telegram/nakupca
```

Health check:

```bash
curl https://nakup.voskar.sk/api/v1/telegram/nakupca
```

## Register webhook

After deploying the app and setting env vars:

```bash
curl -X POST "https://api.telegram.org/bot$NAKUPCA_TELEGRAM_BOT_TOKEN/setWebhook" \
  -H 'Content-Type: application/json' \
  -d "{
    \"url\": \"https://nakup.voskar.sk/api/v1/telegram/nakupca\",
    \"secret_token\": \"$NAKUPCA_TELEGRAM_WEBHOOK_SECRET\",
    \"allowed_updates\": [\"message\"]
  }"
```

Verify:

```bash
curl "https://api.telegram.org/bot$NAKUPCA_TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

## Production notes

This MVP does not perform actual checkout/payment at Lunys or Tesco. It prepares and manages the shared list, suggests meal bundles, and labels items so the human/agent can choose Lunys vs Tesco. Real e-shop ordering should be added behind explicit confirmation and spending limits.
