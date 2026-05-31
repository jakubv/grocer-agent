import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type CurrentShoppingItem = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  addedByUserId: string;
  addedAt: Date;
  notes: string | null;
  isChecked: boolean;
};

// GET /api/v1/list/current
// Returns the active shopping list for the household.
// For v1 we use a single default household.
export async function GET() {
  try {
    // Get or create default household
    let household = await prisma.household.findFirst();

    if (!household) {
      household = await prisma.household.create({
        data: {
          name: "Voskar Household",
        },
      });
    }

    // Get active list or create one
    let list = await prisma.shoppingList.findFirst({
      where: {
        householdId: household.id,
        status: 'active',
      },
      include: {
        items: {
          orderBy: { addedAt: 'asc' },
        },
      },
    });

    if (!list) {
      list = await prisma.shoppingList.create({
        data: {
          householdId: household.id,
          status: 'active',
        },
        include: {
          items: true,
        },
      });
    }

    return NextResponse.json({
      id: list.id,
      householdId: list.householdId,
      status: list.status,
      updatedAt: list.updatedAt,
      items: list.items.map((item: CurrentShoppingItem) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        addedBy: item.addedByUserId, // For now we store userId, later we can resolve name
        addedAt: item.addedAt,
        notes: item.notes,
        isChecked: item.isChecked,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
