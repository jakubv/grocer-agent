import { prisma } from '@/lib/prisma';
import { TESCO_GROCERIES, tescoSearchUrl } from './constants';
import { serializeProposal } from './proposal';

export interface ManualApproveResult {
  proposal: ReturnType<typeof serializeProposal> extends (p: infer P) => unknown ? never : unknown;
  cart_url: string;
  search_urls: { line_id: string; raw_name: string; search_query: string; url: string }[];
  message: string;
  mode: 'manual';
}

export async function approveTescoManual(
  householdId: string,
  proposalId: string,
  approvedBy: string
) {
  const cartUrl = `${TESCO_GROCERIES}/trolley`;

  const proposal = await prisma.tescoProposal.findFirstOrThrow({
    where: { id: proposalId, householdId },
    include: { lines: true },
  });

  const lines = proposal.lines.filter((l) => l.status !== 'skipped');

  await prisma.tescoProposal.update({
    where: { id: proposalId },
    data: {
      status: 'cart_ready',
      cartUrl,
      approvedBy,
      approvedAt: new Date(),
      errorMessage: null,
    },
  });

  for (const line of lines) {
    await prisma.tescoProposalLine.update({
      where: { id: line.id },
      data: { status: 'matched', failReason: null },
    });
  }

  const final = await prisma.tescoProposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: { lines: true },
  });

  const search_urls = lines.map((l) => ({
    line_id: l.id,
    raw_name: l.rawName,
    search_query: l.searchQuery,
    url: tescoSearchUrl(l.searchQuery),
  }));

  return {
    proposal: serializeProposal(final),
    cart_url: cartUrl,
    search_urls,
    mode: 'manual' as const,
    message:
      'Otvorte vyhľadávania v Tesco, pridajte produkty do košíka a zaplaťte na stránke Tesco.',
  };
}