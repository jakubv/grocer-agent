import { chromium } from 'playwright';
import path from 'path';
import os from 'os';

const CHROME = path.join(os.homedir(), 'Library/Application Support/Google/Chrome');
const TARGET_IP = '76.76.21.21';
const SUBDOMAIN = 'nakup';

async function main() {
  console.log('Launching Chrome profile (close Chrome first if this fails)...');
  const context = await chromium.launchPersistentContext(CHROME, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1400, height: 900 },
  });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://admin.websupport.sk/sk/domain/voskar.sk/dns', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await page.waitForTimeout(3000);
  const url = page.url();
  console.log('Current URL:', url);

  if (url.includes('login') || url.includes('prihlas')) {
    console.log('Not logged in — please log in manually in the opened window, then re-run.');
    await page.waitForTimeout(120000);
  }

  // Try common Websupport UI patterns
  const addBtn = page.getByRole('button', { name: /prida|add|nový|new/i }).first();
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'websupport-dns-debug.png', fullPage: true });
  console.log('Screenshot saved: websupport-dns-debug.png');
  console.log('Page title:', await page.title());

  await context.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});