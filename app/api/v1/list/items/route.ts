import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-auth';

// POST /api/v1/list/items
// Add one or more items to the current shopping list
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'items array is required' },
        { status: 400 }
      );
    }

    // Get active list (create if doesn't exist)
    let household = await prisma.household.findFirst();
    if (!household) {
      household = await prisma.household.create({ data: { name: "Voskar Household" } });
    }

    let list = await prisma.shoppingList.findFirst({
      where: { householdId: household.id, status: 'active' },
    });

    if (!list) {
      list = await prisma.shoppingList.create({
        data: { householdId: household.id, status: 'active' },
      });
    }

    // For v1 we use a default user ID. Later this will come from the authenticated user/agent.
    const defaultAddedBy = "agent"; // or "Jakub" / "Mirka" depending on context

    const createdItems = await prisma.$transaction(
      items.map((item: any) =>
        prisma.shoppingItem.create({
          data: {
            listId: list.id,
            name: item.name,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            category: item.category ?? 'Ostatné',
            addedByUserId: defaultAddedBy,
            notes: item.notes ?? null,
            isChecked: false,
          },
        })
      )
    );

    return NextResponse.json(
      {
        message: "Items added successfully",
        items: createdItems,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
