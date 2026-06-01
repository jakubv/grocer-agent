import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type UpdateShoppingItemBody = {
  name?: unknown;
  quantity?: unknown;
  unit?: unknown;
  category?: unknown;
  notes?: unknown;
  isChecked?: unknown;
};

const toOptionalString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const toOptionalNumber = (value: unknown) => {
  if (value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }
  return undefined;
};

// PATCH /api/v1/list/items/{id}
// Update an item (partial update supported)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = (await request.json()) as UpdateShoppingItemBody;
    const data: {
      name?: string;
      quantity?: number | null;
      unit?: string | null;
      category?: string;
      notes?: string | null;
      isChecked?: boolean;
    } = {};

    if (typeof body.name === 'string') data.name = body.name.trim();
    if ('quantity' in body) data.quantity = toOptionalNumber(body.quantity);
    if ('unit' in body) data.unit = toOptionalString(body.unit);
    if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim();
    if ('notes' in body) data.notes = toOptionalString(body.notes);
    if (typeof body.isChecked === 'boolean') data.isChecked = body.isChecked;

    if (data.name === '') {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'name cannot be empty' },
        { status: 400 },
      );
    }

    const updatedItem = await prisma.shoppingItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/v1/list/items/{id}
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.shoppingItem.delete({ where: { id } });
    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
