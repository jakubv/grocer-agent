import { prisma } from '@/lib/prisma';
import { getOrCreateActiveList, getOrCreateHousehold } from '@/lib/household';
import { matchItemsToTesco } from './matcher';

export function serializeProposal(
  proposal: {
    id: string;
    status: string;
    estimatedTotal: number | null;
    cartUrl: string | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
    approvedAt: Date | null;
    approvedBy: string | null;
    lines: {
      id: string;
      shoppingItemId: string | null;
      rawName: string;
      quantity: number;
      unit: string | null;
      searchQuery: string;
      tescoProductName: string | null;
      tescoPrice: number | null;
      tescoProductUrl: string | null;
      confidence: number | null;
      status: string;
      failReason: string | null;
    }[];
  }
) {
  return {
    id: proposal.id,
    status: proposal.status,
    estimated_total: proposal.estimatedTotal,
    cart_url: proposal.cartUrl,
    error_message: proposal.errorMessage,
    created_at: proposal.createdAt.toISOString(),
    updated_at: proposal.updatedAt.toISOString(),
    approved_at: proposal.approvedAt?.toISOString() ?? null,
    approved_by: proposal.approvedBy,
    lines: proposal.lines.map((l) => ({
      id: l.id,
      shopping_item_id: l.shoppingItemId,
      raw_name: l.rawName,
      quantity: l.quantity,
      unit: l.unit,
      search_query: l.searchQuery,
      tesco_product_name: l.tescoProductName,
      tesco_price: l.tescoPrice,
      tesco_product_url: l.tescoProductUrl,
      confidence: l.confidence,
      status: l.status,
      fail_reason: l.failReason,
    })),
  };
}

export async function createTescoProposal(householdId: string, enrichFromWeb: boolean) {
  const list = await getOrCreateActiveList(householdId);
  if (list.items.length === 0) {
    throw new Error('Shopping list is empty');
  }

  await prisma.tescoProposal.updateMany({
    where: { householdId, status: { in: ['draft', 'ready'] } },
    data: { status: 'superseded' },
  });

  const matched = await matchItemsToTesco(
    list.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      category: i.category,
      notes: i.notes,
    }))
  );

  const proposal = await prisma.tescoProposal.create({
    data: {
      householdId,
      shoppingListId: list.id,
      status: 'draft',
      lines: {
        create: matched.map((m) => ({
          shoppingItemId: m.shopping_item_id,
          rawName: m.raw_name,
          quantity: m.quantity,
          unit: m.unit,
          searchQuery: m.search_query,
          tescoProductName: m.tesco_product_name,
          confidence: m.confidence,
          status: 'matched',
        })),
      },
    },
    include: { lines: true },
  });

  if (enrichFromWeb && process.env.TESCO_ENRICH_SEARCH === 'true') {
    const { searchTescoProduct } = await import('./browser');
    let total = 0;
    for (const line of proposal.lines) {
      const hit = await searchTescoProduct(householdId, line.searchQuery);
      if (hit) {
        await prisma.tescoProposalLine.update({
          where: { id: line.id },
          data: {
            tescoProductName: hit.name,
            tescoPrice: hit.price,
            tescoProductUrl: hit.url,
            tescoProductId: hit.productId,
          },
        });
        if (hit.price) total += hit.price * line.quantity;
      }
    }
    await prisma.tescoProposal.update({
      where: { id: proposal.id },
      data: { estimatedTotal: total > 0 ? total : null, status: 'ready' },
    });
  } else {
    await prisma.tescoProposal.update({
      where: { id: proposal.id },
      data: { status: 'ready' },
    });
  }

  return prisma.tescoProposal.findUniqueOrThrow({
    where: { id: proposal.id },
    include: { lines: true },
  });
}

export async function getLatestTescoProposal(householdId: string) {
  return prisma.tescoProposal.findFirst({
    where: {
      householdId,
      status: { notIn: ['superseded'] },
    },
    orderBy: { createdAt: 'desc' },
    include: { lines: true },
  });
}