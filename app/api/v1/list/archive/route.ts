import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import {
  getOrCreateActiveList,
  getOrCreateHousehold,
  parseAddedBy,
} from '@/lib/household';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({}));
    const orderedFrom = body.ordered_from ?? body.orderedFrom ?? null;
    const notes = body.notes ?? null;
    const archivedBy = parseAddedBy(body.archived_by ?? body.archivedBy);

    const household = await getOrCreateHousehold();
    const activeList = await getOrCreateActiveList(household.id);

    if (activeList.items.length === 0) {
      return NextResponse.json(
        { error: { code: 'EMPTY_LIST', message: 'No items to archive' } },
        { status: 400 }
      );
    }

    const archived = await prisma.$transaction(async (tx) => {
      const snapshot = await tx.archivedList.create({
        data: {
          householdId: household.id,
          archivedByUserId: archivedBy,
          orderedFrom,
          notes,
          totalItems: activeList.items.length,
          items: {
            create: activeList.items.map((item) => ({
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

      await tx.shoppingList.update({
        where: { id: activeList.id },
        data: { status: 'archived' },
      });

      await tx.shoppingList.create({
        data: { householdId: household.id, status: 'active' },
      });

      return snapshot;
    });

    return NextResponse.json({
      message: 'List archived successfully',
      archived_id: archived.id,
      archived_items: activeList.items.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}