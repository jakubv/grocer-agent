import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type IncomingShoppingItem = {
  name?: unknown;
  quantity?: unknown;
  unit?: unknown;
  category?: unknown;
  addedBy?: unknown;
  notes?: unknown;
};

const toOptionalString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const toOptionalNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }
  return null;
};

// POST /api/v1/list/items
// Add one or more items to the current shopping list.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items?: IncomingShoppingItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'items array is required' },
        { status: 400 },
      );
    }

    const invalidItem = items.find((item) => typeof item.name !== 'string' || !item.name.trim());
    if (invalidItem) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'each item requires a non-empty name' },
        { status: 400 },
      );
    }

    // Get active list (create if it doesn't exist)
    let household = await prisma.household.findFirst();
    if (!household) {
      household = await prisma.household.create({ data: { name: 'Voskar Household' } });
    }

    let list = await prisma.shoppingList.findFirst({
      where: { householdId: household.id, status: 'active' },
    });

    if (!list) {
      list = await prisma.shoppingList.create({
        data: { householdId: household.id, status: 'active' },
      });
    }

    const createdItems = await prisma.$transaction(
      items.map((item) =>
        prisma.shoppingItem.create({
          data: {
            listId: list.id,
            name: String(item.name).trim(),
            quantity: toOptionalNumber(item.quantity),
            unit: toOptionalString(item.unit),
            category: toOptionalString(item.category) ?? 'Ostatné',
            addedByUserId: toOptionalString(item.addedBy) ?? 'agent',
            notes: toOptionalString(item.notes),
            isChecked: false,
          },
        }),
      ),
    );

    return NextResponse.json(
      {
        message: 'Items added successfully',
        items: createdItems,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
