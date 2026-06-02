import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { getOrCreateHousehold } from '@/lib/household';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const household = await getOrCreateHousehold();

    const archived = await prisma.archivedList.findFirst({
      where: { id, householdId: household.id },
      include: { items: true },
    });

    if (!archived) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Archived list not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: archived.id,
      archived_at: archived.archivedAt.toISOString(),
      archived_by: archived.archivedByUserId,
      ordered_from: archived.orderedFrom,
      notes: archived.notes,
      total_items: archived.totalItems,
      items: archived.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        added_by: item.addedBy,
        notes: item.notes,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}