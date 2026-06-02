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
  produce: 'Zelenina a ovocie',
  dairy: 'Mliečne výrobky',
  meat: 'Mäso a údeniny',
  bakery: 'Pekárenské výrobky',
  pantry: 'Trvanlivé potraviny',
  drinks: 'Nápoje',
  household: 'Domácnosť',
  other: 'Ostatné',
} as const;

const MEAL_BUNDLES: Record<string, ParsedItem[]> = {
  krevety: [
    { name: 'Krevety mrazené 500g', category: CATEGORIES.meat, notes: 'Lunys/Tesco podľa dostupnosti' },
    { name: 'Citróny 2 ks', category: CATEGORIES.produce, notes: 'Na krevety' },
    { name: 'Cesnak', category: CATEGORIES.produce, notes: 'Na krevety' },
    { name: 'Bageta alebo čerstvé pečivo', category: CATEGORIES.bakery, notes: 'K večeri' },
    { name: 'Maslo', category: CATEGORIES.dairy, notes: 'Cesnakové krevety' },
  ],
  cestoviny: [
    { name: 'Cestoviny', category: CATEGORIES.pantry },
    { name: 'Parmezán alebo Grana Padano', category: CATEGORIES.dairy },
    { name: 'Cherry paradajky', category: CATEGORIES.produce },
    { name: 'Bazalka', category: CATEGORIES.produce },
  ],
  tacos: [
    { name: 'Tortilly', category: CATEGORIES.pantry },
    { name: 'Mleté mäso alebo kuracie prsia', category: CATEGORIES.meat },
    { name: 'Avokádo', category: CATEGORIES.produce, notes: 'Lunys ak je pekné' },
    { name: 'Salsa', category: CATEGORIES.pantry },
    { name: 'Limeta', category: CATEGORIES.produce },
  ],
  burger: [
    { name: 'Burger žemle', category: CATEGORIES.bakery },
    { name: 'Hovädzie mleté mäso', category: CATEGORIES.meat },
    { name: 'Cheddar', category: CATEGORIES.dairy },
    { name: 'Kyslé uhorky', category: CATEGORIES.pantry },
    { name: 'Šalát', category: CATEGORIES.produce },
  ],
};

const HELP_MESSAGE = `Som Nákupca — solo bot pre GrocerAgent na Lunys/Tesco.

Čo viem v MVP:
• /zoznam — ukážem aktuálny nákupný zoznam
• /pridaj mlieko, banány, toaletný papier — pridám položky
• /zmaz mlieko — zmažem prvú zhodnú položku
• /navrhni krevety — pridám rozumný balíček surovín k jedlu
• /archivuj — archivujem aktuálny zoznam po objednaní

Môžeš písať aj prirodzene:
„pridaj banány a grécky jogurt“
„mám chuť na krevety“
„čo je v zozname?“`;

const normalize = (text: string) =>
  text
    .toLocaleLowerCase('sk-SK')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const inferCategory = (name: string): string => {
  const n = normalize(name);

  if (/(banan|jabl|citron|limet|cesnak|paradaj|avokad|salat|bazalka|zelen|ovoc|uhork)/.test(n)) {
    return CATEGORIES.produce;
  }
  if (/(mlieko|jogurt|maslo|syr|cheddar|parmezan|grana|smotana|tvaroh)/.test(n)) {
    return CATEGORIES.dairy;
  }
  if (/(maso|kurac|hovadz|bravc|krev|sunk|slan|uden|ryb)/.test(n)) {
    return CATEGORIES.meat;
  }
  if (/(chlieb|peciv|baget|zeml|rozok)/.test(n)) {
    return CATEGORIES.bakery;
  }
  if (/(voda|mineralk|džus|dzus|cola|napoj|pivo|vino)/.test(n)) {
    return CATEGORIES.drinks;
  }
  if (/(papier|toalet|droger|jar|tablety|prasok|vrecia|servit|utierk)/.test(n)) {
    return CATEGORIES.household;
  }
  if (/(cestovin|ryz|muka|cukor|olej|konzerv|salsa|tortill|kava|caj)/.test(n)) {
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
  let household = await prisma.household.findFirst();
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
  if (items.length === 0) return 'Zoznam je zatiaľ prázdny.';

  const grouped = items.reduce<Record<string, ShoppingItemForBot[]>>((acc, item) => {
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

  const created = await prisma.$transaction(
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

  return created;
};

const deleteByName = async (query: string) => {
  const { list } = await getOrCreateActiveList();
  const q = normalize(query);
  const match = list.items.find((item) => normalize(item.name).includes(q));

  if (!match) return null;
  await prisma.shoppingItem.delete({ where: { id: match.id } });
  return match;
};

const archiveCurrentList = async () => {
  const { household, list } = await getOrCreateActiveList();
  if (list.items.length === 0) return 0;

  await prisma.archivedList.create({
    data: {
      householdId: household.id,
      archivedByUserId: 'Nákupca',
      orderedFrom: 'Lunys/Tesco',
      notes: 'Archivované cez Telegram bota Nákupca',
      totalItems: list.items.length,
      items: {
        create: list.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          addedBy: item.addedByUserId,
          notes: item.notes,
        })),
      },
    },
  });

  await prisma.shoppingList.update({ where: { id: list.id }, data: { status: 'archived' } });
  await prisma.shoppingList.create({ data: { householdId: household.id, status: 'active' } });

  return list.items.length;
};

const pickMealBundle = (text: string) => {
  const n = normalize(text);
  return Object.entries(MEAL_BUNDLES).find(([keyword]) => n.includes(normalize(keyword)));
};

export const handleNakupcaMessage = async (text: string, fromName = 'Telegram') => {
  const clean = text.trim();
  const lower = normalize(clean);

  if (!clean || lower === '/start' || lower === '/help' || lower === 'help') return HELP_MESSAGE;

  if (lower.startsWith('/zoznam') || lower.includes('co je v zozname') || lower.includes('ukaz zoznam')) {
    const { list } = await getOrCreateActiveList();
    return `Aktuálny zoznam:\n\n${renderList(list.items)}`;
  }

  if (lower.startsWith('/zmaz') || lower.startsWith('zmaz') || lower.startsWith('odstran')) {
    const query = clean.replace(/^\/?(zmaz|odstráň|odstran)\s*/iu, '').trim();
    if (!query) return 'Napíš čo mám zmazať, napr. /zmaz mlieko';
    const deleted = await deleteByName(query);
    return deleted ? `Zmazal som: ${deleted.name}` : `Nenašiel som položku podobnú: ${query}`;
  }

  if (lower.startsWith('/archivuj') || lower === 'archivuj') {
    const count = await archiveCurrentList();
    return count > 0
      ? `Archivoval som ${count} položiek. Nový zoznam je pripravený.`
      : 'Aktuálny zoznam je prázdny, nič som nearchivoval.';
  }

  const mealBundle = lower.startsWith('/navrhni') || lower.includes('mam chut') ? pickMealBundle(clean) : undefined;
  if (mealBundle) {
    const [meal, items] = mealBundle;
    const created = await addItems(items, fromName);
    return `Navrhol som nákup na „${meal}“ a pridal ${created.length} položiek.\n\n${created
      .map((item) => `• ${item.name}`)
      .join('\n')}\n\nLunys preferuj na čerstvé veci, Tesco na trvanlivé/domácnosť.`;
  }

  if (lower.startsWith('/pridaj') || lower.startsWith('pridaj') || lower.startsWith('kup') || lower.startsWith('daj')) {
    const rawItems = clean.replace(/^\/?(pridaj|kup|daj)\s*/iu, '').trim();
    const items = splitItems(rawItems);
    if (items.length === 0) return 'Napíš čo mám pridať, napr. /pridaj mlieko, banány';

    const created = await addItems(items, fromName);
    return `Pridal som ${created.length} položiek:\n${created.map((item) => `• ${item.name}`).join('\n')}`;
  }

  return `Rozumiem. V MVP viem najistejšie pracovať so zoznamom cez príkazy.\n\n${HELP_MESSAGE}`;
};

export const sendTelegramMessage = async (chatId: number | string, text: string) => {
  const token = process.env.NAKUPCA_TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('NAKUPCA_TELEGRAM_BOT_TOKEN is not configured');

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
