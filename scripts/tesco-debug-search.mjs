import { config } from 'dotenv';
config({ path: '.env.production.local', override: true });
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
});

const q = process.argv[2] || 'odpadkové vrecká';
const session = await prisma.storeSession.findFirst({ where: { store: 'tesco' } });
const cookies = JSON.parse(session.cookiesJson);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: 'sk-SK' });
await context.addCookies(cookies);
const page = await context.newPage();
const url = `https://potravinydomov.itesco.sk/groceries/sk-SK/search?query=${encodeURIComponent(q)}`;
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);
console.log('URL:', page.url());
const stats = await page.evaluate(() => ({
  productLinks: document.querySelectorAll('a[href*="/products/"]').length,
  tileLinks: document.querySelectorAll('a[data-testid="product-tile-link"]').length,
  title: document.title,
  h1: document.querySelector('h1')?.textContent?.trim(),
  sampleHref: document.querySelector('a[href*="/products/"]')?.getAttribute('href'),
}));
console.log(JSON.stringify(stats, null, 2));
await browser.close();
await prisma.$disconnect();