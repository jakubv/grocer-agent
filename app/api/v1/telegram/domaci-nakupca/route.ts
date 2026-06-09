import { NextRequest, NextResponse } from 'next/server';
import { handleDomaciNakupcaMessage, sendDomaciNakupcaTelegramMessage } from '@/lib/domaci-nakupca-bot';

type TelegramUser = {
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number; type: string };
  from?: TelegramUser;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

const getSenderName = (from?: TelegramUser) => {
  if (!from) return 'Telegram';
  const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ').trim();
  return fullName || from.username || 'Telegram';
};

const isAuthorizedWebhook = (request: NextRequest) => {
  const secret = process.env.DOMACI_NAKUPCA_TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;

  return request.headers.get('x-telegram-bot-api-secret-token') === secret;
};

// GET /api/v1/telegram/domaci-nakupca
// Health check for webhook setup.
export async function GET() {
  return NextResponse.json({
    ok: true,
    bot: 'domaci-nakupca',
    displayName: 'Domáci Nákupca',
    configured: Boolean(process.env.DOMACI_NAKUPCA_TELEGRAM_BOT_TOKEN),
    integrations: {
      googleList: Boolean(process.env.DOMACI_NAKUPCA_GOOGLE_KEEP_NOTE_URL || process.env.DOMACI_NAKUPCA_GOOGLE_SHEET_ID),
      tesco: Boolean(process.env.DOMACI_NAKUPCA_TESCO_USERNAME && process.env.DOMACI_NAKUPCA_TESCO_PASSWORD),
      lunys: Boolean(process.env.DOMACI_NAKUPCA_LUNYS_USERNAME && process.env.DOMACI_NAKUPCA_LUNYS_PASSWORD),
    },
  });
}

// POST /api/v1/telegram/domaci-nakupca
// Telegram webhook endpoint for the standalone Domáci Nákupca bot.
export async function POST(request: NextRequest) {
  if (!isAuthorizedWebhook(request)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;

  if (!message?.text) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const reply = await handleDomaciNakupcaMessage(message.text, getSenderName(message.from));
  await sendDomaciNakupcaTelegramMessage(message.chat.id, reply);

  return NextResponse.json({ ok: true });
}
