import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { normalizeCategory } from '@/lib/categories';
import {
  getOrCreateActiveList,
  getOrCreateHousehold,
  serializeItem,
} from '@/lib/household';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const body = await request.json();
    const household = await getOrCreateHousehold();
    const list = await getOrCreateActiveList(household.id);

    const existing = await prisma.shoppingItem.findFirst({
      where: { id, listId: list.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'ITEM_NOT_FOUND', message: `Item ${id} not found` } },
        { status: 404 }
      );
    }

    const updated = await prisma.shoppingItem.update({
      where: { id },
      data: {
        name: body.name !== undefined ? String(body.name).trim() : undefined,
        quantity: body.quantity !== undefined ? body.quantity : undefined,
        unit: body.unit !== undefined ? body.unit : undefined,
        category:
          body.category !== undefined
            ? normalizeCategory(body.category)
            : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        isChecked:
          body.is_checked !== undefined ? Boolean(body.is_checked) : undefined,
      },
    });

    return NextResponse.json({ item: serializeItem(updated) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const household = await getOrCreateHousehold();
    const list = await getOrCreateActiveList(household.id);

    const existing = await prisma.shoppingItem.findFirst({
      where: { id, listId: list.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'ITEM_NOT_FOUND', message: `Item ${id} not found` } },
        { status: 404 }
      );
    }

    await prisma.shoppingItem.delete({ where: { id } });

    return NextResponse.json({ message: 'Item deleted' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}