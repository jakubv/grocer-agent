import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { getOrCreateHousehold } from '@/lib/household';
import { createTescoProposal, serializeProposal } from '@/lib/tesco/proposal';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  try {
    const body = await request.json().catch(() => ({}));
    const enrich = Boolean(body.enrich_from_web);
    const household = await getOrCreateHousehold();
    const proposal = await createTescoProposal(household.id, enrich);
    return NextResponse.json({ proposal: serializeProposal(proposal) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: {
          code: 'PREPARE_FAILED',
          message: error instanceof Error ? error.message : 'Prepare failed',
        },
      },
      { status: 500 }
    );
  }
}