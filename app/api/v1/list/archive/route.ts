import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ActiveShoppingItem = {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  addedByUserId: string;
  notes: string | null;
};

// POST /api/v1/list/archive
// Archives the current list and creates a new empty one
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderedFrom, notes } = body;

    let household = await prisma.household.findFirst();
    if (!household) {
      household = await prisma.household.create({ data: { name: "Voskar Household" } });
    }

    // Find active list
    const activeList = await prisma.shoppingList.findFirst({
      where: { householdId: household.id, status: 'active' },
      include: { items: true },
    });

    if (!activeList || activeList.items.length === 0) {
      return NextResponse.json(
        { message: "No active list to archive" },
        { status: 200 }
      );
    }

    // Create archived snapshot
    await prisma.archivedList.create({
      data: {
        householdId: household.id,
        archivedByUserId: "agent", // or real user later
        orderedFrom: orderedFrom ?? null,
        notes: notes ?? null,
        totalItems: activeList.items.length,
        items: {
          create: activeList.items.map((item: ActiveShoppingItem) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            addedBy: item.addedByUserId,
            notes: item.notes,
          })),
        },
      },
    });

    // Mark old list as archived and create new one
    await prisma.shoppingList.update({
      where: { id: activeList.id },
      data: { status: 'archived' },
    });

    await prisma.shoppingList.create({
      data: {
        householdId: household.id,
        status: 'active',
      },
    });

    return NextResponse.json({
      message: "List archived successfully",
      archivedItems: activeList.items.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
