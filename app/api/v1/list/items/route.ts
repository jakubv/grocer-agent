import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { DEFAULT_CATEGORY, normalizeCategory } from '@/lib/categories';
import {
  ensureUsers,
  getOrCreateActiveList,
  getOrCreateHousehold,
  parseAddedBy,
  serializeItem,
} from '@/lib/household';
import { prisma } from '@/lib/prisma';

interface IncomingItem {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null;
  notes?: string | null;
}

export async function POST(request: NextRequest) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { items, added_by: addedByRaw } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'items array is required' } },
        { status: 400 }
      );
    }

    const addedBy = parseAddedBy(addedByRaw);
    const household = await getOrCreateHousehold();
    await ensureUsers(household.id);
    const list = await getOrCreateActiveList(household.id);

    const createdItems = await prisma.$transaction(
      items.map((item: IncomingItem) =>
        prisma.shoppingItem.create({
          data: {
            listId: list.id,
            name: String(item.name).trim(),
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            category: normalizeCategory(item.category ?? DEFAULT_CATEGORY),
            addedByUserId: addedBy,
            notes: item.notes ?? null,
            isChecked: false,
          },
        })
      )
    );

    return NextResponse.json(
      {
        message: 'Items added successfully',
        items: createdItems.map(serializeItem),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}