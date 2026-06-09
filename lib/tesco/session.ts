import { prisma } from '@/lib/prisma';

const STORE = 'tesco';

export async function getTescoCookies(householdId: string): Promise<string | null> {
  const row = await prisma.storeSession.findUnique({
    where: { householdId_store: { householdId, store: STORE } },
  });
  return row?.cookiesJson ?? null;
}

export async function saveTescoCookies(householdId: string, cookiesJson: string) {
  await prisma.storeSession.upsert({
    where: { householdId_store: { householdId, store: STORE } },
    create: { householdId, store: STORE, cookiesJson },
    update: { cookiesJson, updatedAt: new Date() },
  });
}

export async function hasTescoSession(householdId: string): Promise<boolean> {
  const cookies = await getTescoCookies(householdId);
  return Boolean(cookies && cookies.length > 10);
}