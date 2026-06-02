import { config } from 'dotenv';
config({ path: '.env.production.local', override: true });

const { createTescoProposal } = await import('../lib/tesco/proposal.ts');
const { getOrCreateHousehold } = await import('../lib/household.ts');

try {
  const h = await getOrCreateHousehold();
  const p = await createTescoProposal(h.id, false);
  console.log('SUCCESS', p.id, p.status, p.lines.map((l) => l.rawName + ' -> ' + l.searchQuery));
} catch (e) {
  console.error('FAILED', e);
  process.exit(1);
}