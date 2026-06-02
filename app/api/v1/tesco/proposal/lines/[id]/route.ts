import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { prisma } from '@/lib/prisma';
import { getOrCreateHousehold } from '@/lib/household';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const body = await request.json();
    const household = await getOrCreateHousehold();

    const line = await prisma.tescoProposalLine.findFirst({
      where: { id },
      include: { proposal: true },
    });

    if (!line || line.proposal.householdId !== household.id) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Line not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.tescoProposalLine.update({
      where: { id },
      data: {
        searchQuery: body.search_query ?? undefined,
        quantity: body.quantity !== undefined ? body.quantity : undefined,
        status: body.status ?? undefined,
        tescoProductName: body.tesco_product_name ?? undefined,
      },
    });

    return NextResponse.json({ line: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Update failed' } },
      { status: 500 }
    );
  }
}