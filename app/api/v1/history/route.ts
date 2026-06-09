import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { getOrCreateHousehold } from '@/lib/household';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const household = await getOrCreateHousehold();

    const [data, total] = await Promise.all([
      prisma.archivedList.findMany({
        where: { householdId: household.id },
        orderBy: { archivedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.archivedList.count({ where: { householdId: household.id } }),
    ]);

    return NextResponse.json({
      data: data.map((row) => ({
        id: row.id,
        archived_at: row.archivedAt.toISOString(),
        archived_by: row.archivedByUserId,
        ordered_from: row.orderedFrom,
        total_items: row.totalItems,
        notes: row.notes,
      })),
      meta: { total, limit, offset },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}