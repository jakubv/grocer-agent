import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { getOrCreateHousehold } from '@/lib/household';
import { getLatestTescoProposal, serializeProposal } from '@/lib/tesco/proposal';

export async function GET(request: NextRequest) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  try {
    const household = await getOrCreateHousehold();
    const proposal = await getLatestTescoProposal(household.id);
    if (!proposal) {
      return NextResponse.json({ proposal: null });
    }
    return NextResponse.json({ proposal: serializeProposal(proposal) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to load proposal' } },
      { status: 500 }
    );
  }
}