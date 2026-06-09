import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  let household = await prisma.household.findFirst({
    where: { name: 'Voskar Household' },
  });
  if (!household) {
    household = await prisma.household.create({
      data: { name: 'Voskar Household' },
    });
  }

  for (const u of [
    { name: 'Jakub', email: 'jakub@groceragent.local', role: 'owner' },
    { name: 'Mirka', email: 'mirka@groceragent.local', role: 'member' },
  ]) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: { householdId: household.id, name: u.name, email: u.email, role: u.role },
      update: { name: u.name },
    });
  }

  const existing = await prisma.shoppingList.findFirst({
    where: { householdId: household.id, status: 'active' },
  });

  if (!existing) {
    await prisma.shoppingList.create({
      data: { householdId: household.id, status: 'active' },
    });
  }

  console.log('Seed complete:', household.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());