import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { GROCEBOT_SYSTEM_PROMPT } from '@/lib/grocerbot-prompt';
import {
  ensureUsers,
  getOrCreateActiveList,
  getOrCreateHousehold,
} from '@/lib/household';

export async function POST(request: NextRequest) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  try {
    const { messages, user_name: userName } = await request.json();
    const lastUser = [...(messages || [])]
      .reverse()
      .find((m: { role: string }) => m.role === 'user');

    if (!lastUser?.content) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'No user message' } },
        { status: 400 }
      );
    }

    const household = await getOrCreateHousehold();
    await ensureUsers(household.id);
    const list = await getOrCreateActiveList(household.id);
    const listContext = list.items
      .map((i) => `- ${i.name} (${i.category}, ${i.addedByUserId})`)
      .join('\n');

    const apiKey = process.env.XAI_API_KEY;
    if (apiKey) {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.XAI_MODEL || 'grok-3-mini',
          messages: [
            {
              role: 'system',
              content: `${GROCEBOT_SYSTEM_PROMPT}\n\nAktuálny nákupný zoznam:\n${listContext || '(prázdny)'}\n\nPoužívateľ: ${userName || 'Jakub'}`,
            },
            ...(messages || []).map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
          ],
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return NextResponse.json({ reply });
        }
      }
    }

    const reply = fallbackReply(String(lastUser.content), list.items.length);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Chat failed' } },
      { status: 500 }
    );
  }
}

function fallbackReply(input: string, itemCount: number): string {
  const lower = input.toLowerCase();
  if (lower.includes('krevet')) {
    return `Skvelá voľba! Na krevety by som doplnil: citróny, cesnak, maslo, petržlen a trochu bieleho vína. Chceš, aby som ti položky pridal na zoznam? (Momentálne máte ${itemCount} položiek na zozname.)`;
  }
  if (lower.includes('archiv') || lower.includes('objedn')) {
    return `Archiváciu spravíte na hlavnej stránke tlačidlom „Archivovať a objednať“. Predtým si vyberte Lunys, Tesco alebo oboje. Mám niečo ešte doplniť na zoznam?`;
  }
  return `Rozumiem. Môžem navrhnúť recept, rozdeliť nákup medzi Lunys a Tesco, alebo doplniť konkrétne položky na váš zoznam (teraz ${itemCount} položiek). Čo presne potrebujete?`;
}