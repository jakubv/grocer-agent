import { prisma } from '@/lib/prisma';
import type { ShoppingList, ShoppingItem, Household } from '@prisma/client';

export type HouseholdUserName = 'Jakub' | 'Mirka';

const HOUSEHOLD_NAME = 'Voskar Household';

export async function getOrCreateHousehold(): Promise<Household> {
  let household = await prisma.household.findFirst({
    where: { name: HOUSEHOLD_NAME },
  });
  if (!household) {
    household = await prisma.household.create({
      data: { name: HOUSEHOLD_NAME },
    });
  }
  return household;
}

export async function ensureUsers(householdId: string) {
  const users: { name: HouseholdUserName; email: string }[] = [
    { name: 'Jakub', email: 'jakub@groceragent.local' },
    { name: 'Mirka', email: 'mirka@groceragent.local' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        householdId,
        name: u.name,
        email: u.email,
        role: u.name === 'Jakub' ? 'owner' : 'member',
      },
      update: { name: u.name, householdId },
    });
  }
}

export type ListWithItems = ShoppingList & { items: ShoppingItem[] };

export async function getOrCreateActiveList(
  householdId: string
): Promise<ListWithItems> {
  let list = await prisma.shoppingList.findFirst({
    where: { householdId, status: 'active' },
    include: { items: { orderBy: { addedAt: 'asc' } } },
  });

  if (!list) {
    list = await prisma.shoppingList.create({
      data: { householdId, status: 'active' },
      include: { items: { orderBy: { addedAt: 'asc' } } },
    });
  }

  return list;
}

export function serializeItem(item: ShoppingItem) {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    added_by: item.addedByUserId,
    added_at: item.addedAt.toISOString(),
    notes: item.notes,
    is_checked: item.isChecked,
  };
}

export function serializeList(list: ListWithItems) {
  return {
    id: list.id,
    household_id: list.householdId,
    status: list.status,
    updated_at: list.updatedAt.toISOString(),
    items: list.items.map(serializeItem),
  };
}

export function parseAddedBy(
  value: unknown,
  fallback: HouseholdUserName = 'Jakub'
): HouseholdUserName {
  if (value === 'Mirka' || value === 'Jakub') return value;
  return fallback;
}