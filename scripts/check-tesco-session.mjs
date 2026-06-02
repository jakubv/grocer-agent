import { config } from 'dotenv';
config({ path: '.env.production.local', override: true });
const { prisma } = await import('../lib/prisma.ts');
const s = await prisma.storeSession.findFirst({ where: { store: 'tesco' } });
console.log(s ? `session ok, ${JSON.parse(s.cookiesJson).length} cookies` : 'no session');
await prisma.$disconnect();