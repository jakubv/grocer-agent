import { chromium, type Browser, type BrowserContext, type Cookie } from 'playwright';
import { TESCO_BASE, TESCO_GROCERIES, tescoSearchUrl } from './constants';
import { getTescoCookies, saveTescoCookies } from './session';

export interface SearchResult {
  name: string;
  price: number | null;
  url: string;
  productId: string | null;
}

export interface FillLineInput {
  searchQuery: string;
  quantity: number;
}

export interface FillLineResult {
  searchQuery: string;
  success: boolean;
  productName?: string;
  productUrl?: string;
  error?: string;
}

export async function saveTescoLoginSession(householdId: string, headless = false) {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ locale: 'sk-SK' });
  const page = await context.newPage();
  await page.goto(`${TESCO_BASE}/groceries/sk-SK/login`, { waitUntil: 'domcontentloaded' });
  console.log('Prihláste sa do Tesco v otvorenom okne. Po prihlásení stlačte Enter v termináli…');
  await page.waitForURL(/groceries\/sk-SK(?!\/login)/, { timeout: 300_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const cookies = await context.cookies();
  await saveTescoCookies(householdId, JSON.stringify(cookies));
  await browser.close();
  return cookies.length;
}

async function contextWithSession(
  householdId: string,
  browser: Browser
): Promise<BrowserContext> {
  const raw = await getTescoCookies(householdId);
  const context = await browser.newContext({ locale: 'sk-SK' });
  if (raw) {
    const cookies = JSON.parse(raw) as Cookie[];
    await context.addCookies(cookies);
  }
  return context;
}

export async function searchTescoProduct(
  householdId: string,
  query: string
): Promise<SearchResult | null> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await contextWithSession(householdId, browser);
    const page = await context.newPage();
    await page.goto(tescoSearchUrl(query), { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2500);

    const result = await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>(
        'a[data-testid="product-tile-link"], a[href*="/products/"], .product-tile a'
      );
      if (!link) return null;
      const name =
        link.querySelector('[data-testid="product-title"], h3, .product-tile__title')
          ?.textContent?.trim() ||
        link.getAttribute('aria-label') ||
        link.textContent?.trim() ||
        '';
      const priceText =
        link
          .closest('li, article, div')
          ?.querySelector('[data-testid="product-price"], .price, .beans-price__text')
          ?.textContent?.trim() || '';
      const priceMatch = priceText.replace(',', '.').match(/(\d+\.?\d*)/);
      const href = link.href || '';
      const idMatch = href.match(/products\/(\d+)/);
      return {
        name: name.slice(0, 200),
        price: priceMatch ? parseFloat(priceMatch[1]) : null,
        url: href,
        productId: idMatch ? idMatch[1] : null,
      };
    });

    const cookies = await context.cookies();
    await saveTescoCookies(householdId, JSON.stringify(cookies));
    return result;
  } finally {
    await browser.close();
  }
}

export async function fillTescoCart(
  householdId: string,
  lines: FillLineInput[]
): Promise<{ results: FillLineResult[]; cartUrl: string }> {
  const browser = await chromium.launch({ headless: true });
  const results: FillLineResult[] = [];

  try {
    const context = await contextWithSession(householdId, browser);
    const page = await context.newPage();

    await page.goto(TESCO_GROCERIES, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (page.url().includes('login')) {
      throw new Error(
        'Tesco session expired. Run: npm run tesco:login (locally) and try again.'
      );
    }

    for (const line of lines) {
      try {
        await page.goto(tescoSearchUrl(line.searchQuery), {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        });
        await page.waitForTimeout(2000);

        const productLink = page
          .locator('a[data-testid="product-tile-link"], a[href*="/products/"]')
          .first();
        if ((await productLink.count()) === 0) {
          results.push({
            searchQuery: line.searchQuery,
            success: false,
            error: 'Produkt nenájdený vo vyhľadávaní',
          });
          continue;
        }

        await productLink.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);

        const qty = Math.max(1, line.quantity);
        const qtyInput = page.locator(
          'input[data-testid="quantity"], input#quantity, input[name="quantity"]'
        );
        if ((await qtyInput.count()) > 0) {
          await qtyInput.fill(String(qty));
        }

        const addBtn = page.locator(
          'button[data-testid="add-button"], button:has-text("Pridať"), button:has-text("Do košíka")'
        );
        if ((await addBtn.count()) === 0) {
          results.push({
            searchQuery: line.searchQuery,
            success: false,
            error: 'Tlačidlo Pridať nenájdené',
          });
          continue;
        }
        await addBtn.first().click();
        await page.waitForTimeout(1500);

        const productName = await page
          .locator('h1, [data-testid="product-title"]')
          .first()
          .textContent()
          .catch(() => line.searchQuery);

        results.push({
          searchQuery: line.searchQuery,
          success: true,
          productName: productName?.trim() || line.searchQuery,
          productUrl: page.url(),
        });
      } catch (e) {
        results.push({
          searchQuery: line.searchQuery,
          success: false,
          error: e instanceof Error ? e.message : 'Chyba',
        });
      }
    }

    await page.goto(`${TESCO_GROCERIES}/trolley`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    const cartUrl = page.url();
    const cookies = await context.cookies();
    await saveTescoCookies(householdId, JSON.stringify(cookies));

    return { results, cartUrl };
  } finally {
    await browser.close();
  }
}