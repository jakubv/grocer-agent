import { prisma } from '@/lib/prisma';

type TelegramSendMessageResponse = {
  ok: boolean;
  description?: string;
};

type ShoppingItemForBot = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  addedByUserId: string;
  notes: string | null;
  isChecked: boolean;
  addedAt: Date;
};

type ParsedItem = {
  name: string;
  category: string;
  notes?: string;
};

const CATEGORIES = {
  produce: '🥬 Čerstvé / Lunys',
  dairy: '🥛 Mliečne',
  meat: '🥩 Mäso / ryby',
  bakery: '🥖 Pečivo',
  pantry: '🥫 Trvanlivé / Tesco',
  drinks: '🥤 Nápoje',
  household: '🧻 Domácnosť / drogéria',
  baby: '👶 Deti',
  pet: '🐾 Zvieratá',
  other: '📦 Ostatné',
} as const;

const HELP_MESSAGE = `Som Domáci Nákupca — bot pre rodinné nákupy Jakuba a Mirky.

Čo viem v bezpečnom MVP:
• /zoznam — ukážem aktuálny zoznam
• /pridaj mlieko, banány, toaletný papier — pridám položky
• /zmaz mlieko — zmažem prvú podobnú položku
• /kupene mlieko — označím položku ako kúpenú
• /objednavka — pripravím návrh rozdelenia Tesco/Lunys, nič neobjednávam bez potvrdenia
• /zdroje — ukážem stav integrácií Google Keep/Tesco/Lunys

Vieš písať aj prirodzene:
„pridaj banány a grécky jogurt“
„čo treba kúpiť?“
„priprav objednávku“

Bezpečnostné pravidlo: heslá a platby nikdy neposielaj do chatu. Uložia sa iba cez zabezpečené env/secrets hostingu.`;

const normalize = (text: string) =>
  text
    .toLocaleLowerCase('sk-SK')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const inferCategory = (name: string): string => {
  const n = normalize(name);

  if (/(banan|jabl|citron|limet|cesnak|paradaj|avokad|salat|bazalka|zemiak|cibul|mrkv|zelen|ovoc|uhork|paprik)/.test(n)) {
    return CATEGORIES.produce;
  }
  if (/(mlieko|jogurt|maslo|syr|cheddar|parmezan|grana|smotana|tvaroh|vajc)/.test(n)) {
    return CATEGORIES.dairy;
  }
  if (/(maso|kurac|hovadz|bravc|krev|sunk|slan|uden|ryb|losos|tuniak)/.test(n)) {
    return CATEGORIES.meat;
  }
  if (/(chlieb|peciv|baget|zeml|rozok|croissant)/.test(n)) {
    return CATEGORIES.bakery;
  }
  if (/(voda|mineralk|džus|dzus|cola|napoj|pivo|vino|sirup)/.test(n)) {
    return CATEGORIES.drinks;
  }
  if (/(papier|toalet|droger|jar|tablety|prasok|vrecia|servit|utierk|sampon|mydlo|zubn|kapsul|avivaz|cistiac)/.test(n)) {
    return CATEGORIES.household;
  }
  if (/(plien|vlhcen|dets|sun ar|sunar|prikrm)/.test(n)) {
    return CATEGORIES.baby;
  }
  if (/(granul|mack|pes|steliv)/.test(n)) {
    return CATEGORIES.pet;
  }
  if (/(cestovin|ryz|muka|cukor|olej|konzerv|salsa|tortill|kava|caj|sol|koren|musli|cereal)/.test(n)) {
    return CATEGORIES.pantry;
  }

  return CATEGORIES.other;
};

const splitItems = (raw: string): ParsedItem[] =>
  raw
    .split(/[,;\n]|\sa\s/iu)
    .map((part) => part.trim().replace(/^[-•]\s*/, ''))
    .filter((part) => part.length > 0)
    .map((name) => ({ name, category: inferCategory(name) }));

const getOrCreateActiveList = async () => {
  let household = await prisma.household.findFirst({ where: { name: 'Voskar Household' } });
  if (!household) household = await prisma.household.create({ data: { name: 'Voskar Household' } });

  let list = await prisma.shoppingList.findFirst({
    where: { householdId: household.id, status: 'active' },
    include: { items: { orderBy: { addedAt: 'asc' } } },
  });

  if (!list) {
    list = await prisma.shoppingList.create({
      data: { householdId: household.id, status: 'active' },
      include: { items: { orderBy: { addedAt: 'asc' } } },
    });
  }

  return { household, list };
};

const renderList = (items: ShoppingItemForBot[]) => {
  const activeItems = items.filter((item) => !item.isChecked);
  if (activeItems.length === 0) return 'Zoznam je prázdny. Všetko je buď kúpené alebo ešte nič nepribudlo.';

  const grouped = activeItems.reduce<Record<string, ShoppingItemForBot[]>>((acc, item) => {
    acc[item.category] ??= [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([category, categoryItems]) => {
      const lines = categoryItems.map((item) => `• ${item.name}${item.notes ? ` — ${item.notes}` : ''}`);
      return `*${category}*\n${lines.join('\n')}`;
    })
    .join('\n\n');
};

const addItems = async (items: ParsedItem[], addedBy: string) => {
  const { list } = await getOrCreateActiveList();

  return prisma.$transaction(
    items.map((item) =>
      prisma.shoppingItem.create({
        data: {
          listId: list.id,
          name: item.name,
          category: item.category,
          addedByUserId: addedBy,
          notes: item.notes ?? null,
          isChecked: false,
        },
      }),
    ),
  );
};

const findItemByName = (items: ShoppingItemForBot[], query: string) => {
  const q = normalize(query);
  return items.find((item) => !item.isChecked && normalize(item.name).includes(q));
};

const deleteByName = async (query: string) => {
  const { list } = await getOrCreateActiveList();
  const match = findItemByName(list.items, query);

  if (!match) return null;
  await prisma.shoppingItem.delete({ where: { id: match.id } });
  return match;
};

const markBoughtByName = async (query: string) => {
  const { list } = await getOrCreateActiveList();
  const match = findItemByName(list.items, query);

  if (!match) return null;
  return prisma.shoppingItem.update({ where: { id: match.id }, data: { isChecked: true } });
};

const getPreferredStore = (category: string) => {
  const lunysCategories = new Set<string>([CATEGORIES.produce, CATEGORIES.bakery, CATEGORIES.meat]);
  const tescoCategories = new Set<string>([CATEGORIES.household, CATEGORIES.pantry, CATEGORIES.drinks, CATEGORIES.baby, CATEGORIES.pet]);

  if (lunysCategories.has(category)) return 'Lunys';
  if (tescoCategories.has(category)) return 'Tesco';
  return 'Tesco/Lunys podľa dostupnosti';
};

const renderOrderDraft = (items: ShoppingItemForBot[]) => {
  const activeItems = items.filter((item) => !item.isChecked);
  if (activeItems.length === 0) return 'Nemám z čoho pripraviť objednávku — zoznam je prázdny.';

  const grouped = activeItems.reduce<Record<string, ShoppingItemForBot[]>>((acc, item) => {
    const store = getPreferredStore(item.category);
    acc[store] ??= [];
    acc[store].push(item);
    return acc;
  }, {});

  const body = Object.entries(grouped)
    .map(([store, storeItems]) => `*${store}*\n${storeItems.map((item) => `• ${item.name}`).join('\n')}`)
    .join('\n\n');

  return `Návrh objednávky — zatiaľ nič neobjednávam:\n\n${body}\n\nĎalšia fáza bude: prihlásiť sa do Tesco/Lunys, nájsť produkty, vložiť do košíka a pred platbou vypýtať potvrdenie.`;
};

const renderSources = () => {
  const keepConfigured = Boolean(process.env.DOMACI_NAKUPCA_GOOGLE_KEEP_NOTE_URL || process.env.DOMACI_NAKUPCA_GOOGLE_SHEET_ID);
  const tescoConfigured = Boolean(process.env.DOMACI_NAKUPCA_TESCO_USERNAME && process.env.DOMACI_NAKUPCA_TESCO_PASSWORD);
  const lunysConfigured = Boolean(process.env.DOMACI_NAKUPCA_LUNYS_USERNAME && process.env.DOMACI_NAKUPCA_LUNYS_PASSWORD);

  return `Stav integrácií:\n• Telegram bot: ${process.env.DOMACI_NAKUPCA_TELEGRAM_BOT_TOKEN ? 'nastavený' : 'chýba token'}\n• Google Keep/Sheets zdroj: ${keepConfigured ? 'nastavený' : 'chýba'}\n• Tesco login: ${tescoConfigured ? 'nastavený' : 'chýba'}\n• Lunys login: ${lunysConfigured ? 'nastavený' : 'chýba'}\n\nPoznámka: Google Keep nemá oficiálne verejné API pre spoľahlivý serverový sync. Produkčne odporúčam Keep → Google Sheets cez Apps Script, alebo používať priamo Google Sheet ako zdieľaný zoznam.`;
};

export const handleDomaciNakupcaMessage = async (text: string, fromName = 'Telegram') => {
  const clean = text.trim();
  const lower = normalize(clean);

  if (!clean || lower === '/start' || lower === '/help' || lower === 'help') return HELP_MESSAGE;

  if (lower.startsWith('/zoznam') || lower.includes('co treba kupit') || lower.includes('co je v zozname') || lower.includes('ukaz zoznam')) {
    const { list } = await getOrCreateActiveList();
    return `Aktuálny domáci nákupný zoznam:\n\n${renderList(list.items)}`;
  }

  if (lower.startsWith('/zdroje') || lower.startsWith('/integracie')) return renderSources();

  if (lower.startsWith('/objednavka') || lower.startsWith('/objednaj') || lower.includes('priprav objednavku')) {
    const { list } = await getOrCreateActiveList();
    return renderOrderDraft(list.items);
  }

  if (lower.startsWith('/kupene') || lower.startsWith('kupene') || lower.startsWith('mam kupene')) {
    const query = clean.replace(/^\/?(kúpené|kupene|mám kúpené|mam kupene)\s*/iu, '').trim();
    if (!query) return 'Napíš čo mám označiť ako kúpené, napr. /kupene mlieko';
    const updated = await markBoughtByName(query);
    return updated ? `Označil som ako kúpené: ${updated.name}` : `Nenašiel som aktívnu položku podobnú: ${query}`;
  }

  if (lower.startsWith('/zmaz') || lower.startsWith('zmaz') || lower.startsWith('odstran')) {
    const query = clean.replace(/^\/?(zmaz|odstráň|odstran)\s*/iu, '').trim();
    if (!query) return 'Napíš čo mám zmazať, napr. /zmaz mlieko';
    const deleted = await deleteByName(query);
    return deleted ? `Zmazal som: ${deleted.name}` : `Nenašiel som položku podobnú: ${query}`;
  }

  if (lower.startsWith('/pridaj') || lower.startsWith('pridaj') || lower.startsWith('kup') || lower.startsWith('daj')) {
    const rawItems = clean.replace(/^\/?(pridaj|kup|daj)\s*/iu, '').trim();
    const items = splitItems(rawItems);
    if (items.length === 0) return 'Napíš čo mám pridať, napr. /pridaj mlieko, banány';

    const created = await addItems(items, fromName);
    return `Pridal som ${created.length} položiek:\n${created.map((item) => `• ${item.name}`).join('\n')}`;
  }

  return `Rozumiem. Zatiaľ pracujem bezpečne so zoznamom a návrhom objednávky.\n\n${HELP_MESSAGE}`;
};

export const sendDomaciNakupcaTelegramMessage = async (chatId: number | string, text: string) => {
  const token = process.env.DOMACI_NAKUPCA_TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('DOMACI_NAKUPCA_TELEGRAM_BOT_TOKEN is not configured');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });

  const payload = (await response.json()) as TelegramSendMessageResponse;
  if (!response.ok || !payload.ok) {
    throw new Error(payload.description ?? `Telegram sendMessage failed with ${response.status}`);
  }
};
