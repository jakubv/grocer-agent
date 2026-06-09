import { config } from 'dotenv';
config({ path: '.env.production.local', override: true });

const { getOrCreateHousehold } = await import('../lib/household.ts');
const { prisma } = await import('../lib/prisma.ts');
const { fillTescoCart } = await import('../lib/tesco/browser.ts');
const { hasTescoSession } = await import('../lib/tesco/session.ts');

const h = await getOrCreateHousehold();
if (!(await hasTescoSession(h.id))) {
  console.error('No Tesco session. Run: npm run tesco:login');
  process.exit(1);
}

const proposal = await prisma.tescoProposal.findFirst({
  where: { householdId: h.id, status: { in: ['ready', 'draft'] } },
  orderBy: { createdAt: 'desc' },
  include: { lines: true },
});

if (!proposal) {
  console.error('No proposal. Run: node --import tsx scripts/run-prepare-local.mjs');
  process.exit(1);
}

const lines = proposal.lines.filter((l) => l.status !== 'skipped');
console.log(`Filling ${lines.length} items into Tesco cart…`);

await prisma.tescoProposal.update({
  where: { id: proposal.id },
  data: { status: 'approving' },
});

const { results, cartUrl } = await fillTescoCart(
  h.id,
  lines.map((l) => ({ searchQuery: l.searchQuery, quantity: l.quantity }))
);

for (const line of lines) {
  const r = results.find((x) => x.searchQuery === line.searchQuery);
  if (!r) continue;
  await prisma.tescoProposalLine.update({
    where: { id: line.id },
    data: {
      status: r.success ? 'approved' : 'failed',
      failReason: r.error ?? null,
      tescoProductName: r.productName ?? undefined,
      tescoProductUrl: r.productUrl ?? undefined,
    },
  });
}

const failed = results.filter((r) => !r.success).length;
await prisma.tescoProposal.update({
  where: { id: proposal.id },
  data: {
    status: failed === results.length ? 'failed' : 'cart_ready',
    cartUrl,
    errorMessage: failed > 0 ? `${failed} položiek zlyhalo` : null,
  },
});

console.log('\nResults:');
for (const r of results) {
  console.log(r.success ? '✓' : '✗', r.searchQuery, r.productName || r.error);
}
console.log('\n→ Košík:', cartUrl);
await prisma.$disconnect();