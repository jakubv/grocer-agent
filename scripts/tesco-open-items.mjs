/**
 * Opens Tesco search tabs in the default browser (Safari/Chrome).
 * Use when Playwright is blocked by Tesco bot protection.
 */
import { config } from 'dotenv';
import { execSync } from 'node:child_process';
config({ path: '.env.production.local', override: true });

const { prisma } = await import('../lib/prisma.ts');
const { getOrCreateHousehold } = await import('../lib/household.ts');
const { tescoSearchUrl } = await import('../lib/tesco/constants.ts');

const h = await getOrCreateHousehold();
const proposal = await prisma.tescoProposal.findFirst({
  where: { householdId: h.id },
  orderBy: { createdAt: 'desc' },
  include: { lines: true },
});

if (!proposal) {
  console.error('Žiadny návrh — najprv Preložiť na https://nakup.voskar.sk/tesco');
  process.exit(1);
}

const lines = proposal.lines.filter((l) => l.status !== 'skipped');
console.log(`Otváram ${lines.length} vyhľadávaní v prehliadači…`);
for (const line of lines) {
  const url = tescoSearchUrl(line.searchQuery);
  execSync(`open ${JSON.stringify(url)}`);
  await new Promise((r) => setTimeout(r, 800));
}
execSync('open "https://potravinydomov.itesco.sk/groceries/sk-SK/trolley"');
console.log('→ Pridajte prvý výsledok z každého tabu, potom zaplaťte v košíku.');
await prisma.$disconnect();