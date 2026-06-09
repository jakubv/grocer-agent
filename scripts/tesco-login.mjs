import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaLibSql } from '@prisma/adapter-libsql';

function createPrisma() {
  const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  const isRemote =
    url.startsWith('libsql://') ||
    url.startsWith('https://') ||
    Boolean(process.env.TURSO_AUTH_TOKEN);
  const adapter = isRemote
    ? new PrismaLibSql({ url, authToken: process.env.TURSO_AUTH_TOKEN })
    : new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();
const TESCO_BASE = 'https://potravinydomov.itesco.sk';
const profileDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.tesco-browser-profile'
);

async function saveCookies(householdId, cookies) {
  await prisma.storeSession.upsert({
    where: { householdId_store: { householdId, store: 'tesco' } },
    create: { householdId, store: 'tesco', cookiesJson: JSON.stringify(cookies) },
    update: { cookiesJson: JSON.stringify(cookies), updatedAt: new Date() },
  });
}

async function main() {
  const household = await prisma.household.findFirst({ where: { name: 'Voskar Household' } });
  if (!household) throw new Error('Household not found — run npm run db:seed');

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    locale: 'sk-SK',
    viewport: { width: 1280, height: 900 },
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(`${TESCO_BASE}/groceries/sk-SK`, { waitUntil: 'domcontentloaded' });

  if (page.url().includes('login')) {
    console.log('\n→ Prihláste sa do Tesco v otvorenom okne (nechajte ho otvorené, max 5 min).\n');
    await page.goto(`${TESCO_BASE}/groceries/sk-SK/login`, { waitUntil: 'domcontentloaded' });
    await page
      .waitForURL(/groceries\/sk-SK(?!\/login)/, { timeout: 300_000 })
      .catch(() => console.log('⚠ Timeout — ukladám cookies ak sú dostupné.'));
  } else {
    console.log('✓ Už ste prihlásený v profile prehliadača.');
  }

  try {
    await page.waitForTimeout(1500);
  } catch {
    /* window closed */
  }

  const cookies = await context.cookies().catch(() => []);
  const hasAuth = cookies.some(
    (c) => c.name.toLowerCase().includes('session') || c.name.toLowerCase().includes('auth')
  );

  if (cookies.length < 3 && !hasAuth) {
    console.error('✗ Prihlásenie zlyhalo — málo cookies. Skúste znova a nechajte okno otvorené.');
    await context.close().catch(() => {});
    await prisma.$disconnect();
    process.exit(1);
  }

  await saveCookies(household.id, cookies);
  console.log(`✓ Tesco session uložená (${cookies.length} cookies) — ${household.name}`);
  await context.close().catch(() => {});
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});