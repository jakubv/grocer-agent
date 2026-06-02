import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { getOrCreateHousehold, parseAddedBy } from '@/lib/household';
import { prisma } from '@/lib/prisma';

import { hasTescoSession } from '@/lib/tesco/session';
import { serializeProposal } from '@/lib/tesco/proposal';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({}));
    const household = await getOrCreateHousehold();
    const approvedBy = parseAddedBy(body.approved_by);

    const loggedIn = await hasTescoSession(household.id);
    if (!loggedIn) {
      return NextResponse.json(
        {
          error: {
            code: 'NO_TESCO_SESSION',
            message:
              'Najprv sa prihláste do Tesco: na Macu spustite npm run tesco:login v priečinku grocer-agent.',
          },
        },
        { status: 400 }
      );
    }

    const proposal = await prisma.tescoProposal.findFirst({
      where: {
        householdId: household.id,
        status: { in: ['ready', 'draft', 'failed'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { lines: true },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: { code: 'NO_PROPOSAL', message: 'Najprv pripravte Tesco návrh.' } },
        { status: 400 }
      );
    }

    const linesToFill = proposal.lines.filter((l) => l.status !== 'skipped');
    if (linesToFill.length === 0) {
      return NextResponse.json(
        { error: { code: 'EMPTY', message: 'Žiadne položky na objednanie.' } },
        { status: 400 }
      );
    }

    await prisma.tescoProposal.update({
      where: { id: proposal.id },
      data: { status: 'approving', approvedBy, approvedAt: new Date() },
    });

    const { fillTescoCart } = await import('@/lib/tesco/browser');
    const { results, cartUrl } = await fillTescoCart(
      household.id,
      linesToFill.map((l) => ({
        searchQuery: l.searchQuery,
        quantity: l.quantity,
      }))
    );

    for (const line of linesToFill) {
      const r = results.find((x) => x.searchQuery === line.searchQuery);
      if (!r) continue;
      await prisma.tescoProposalLine.update({
        where: { id: line.id },
        data: {
          status: r.success ? 'approved' : 'failed',
          failReason: r.error ?? null,
          tescoProductName: r.productName ?? line.tescoProductName,
          tescoProductUrl: r.productUrl ?? line.tescoProductUrl,
        },
      });
    }

    const failed = results.filter((r) => !r.success).length;
    const final = await prisma.tescoProposal.update({
      where: { id: proposal.id },
      data: {
        status: failed === results.length ? 'failed' : 'cart_ready',
        cartUrl,
        errorMessage:
          failed > 0 ? `${failed} položiek sa nepodarilo pridať do košíka` : null,
      },
      include: { lines: true },
    });

    return NextResponse.json({
      proposal: serializeProposal(final),
      cart_url: cartUrl,
      message:
        failed === 0
          ? 'Košík Tesco je pripravený. Dokončite objednávku na Tesco (platba u vás).'
          : 'Košík čiastočne naplnený — skontrolujte Tesco a doplňte chýbajúce položky.',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: {
          code: 'APPROVE_FAILED',
          message: error instanceof Error ? error.message : 'Approve failed',
        },
      },
      { status: 500 }
    );
  }
}