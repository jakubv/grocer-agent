import 'dotenv/config';
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

async function main() {
  const household = await prisma.household.findFirst({ where: { name: 'Voskar Household' } });
  if (!household) throw new Error('Household not found — run npm run db:seed');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ locale: 'sk-SK' });
  const page = await context.newPage();
  await page.goto(`${TESCO_BASE}/groceries/sk-SK/login`);
  console.log('\n→ Prihláste sa do Tesco v okne prehliadača.');
  console.log('→ Po prihlásení (vidíte úvodný katalóg) zatvorte okno alebo počkajte 3 min.\n');
  await page.waitForURL(/groceries\/sk-SK(?!\/login)/, { timeout: 180_000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const cookies = await context.cookies();
  await prisma.storeSession.upsert({
    where: { householdId_store: { householdId: household.id, store: 'tesco' } },
    create: { householdId: household.id, store: 'tesco', cookiesJson: JSON.stringify(cookies) },
    update: { cookiesJson: JSON.stringify(cookies), updatedAt: new Date() },
  });
  console.log(`✓ Tesco session uložená (${cookies.length} cookies) — domácnosť ${household.name}`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});