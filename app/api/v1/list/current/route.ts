import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import {
  ensureUsers,
  getOrCreateActiveList,
  getOrCreateHousehold,
  serializeList,
} from '@/lib/household';

export async function GET(request: NextRequest) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  try {
    const household = await getOrCreateHousehold();
    await ensureUsers(household.id);
    const list = await getOrCreateActiveList(household.id);
    return NextResponse.json(serializeList(list));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}