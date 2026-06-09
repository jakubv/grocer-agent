import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/access';
import { getOrCreateHousehold } from '@/lib/household';
import { hasTescoSession } from '@/lib/tesco/session';

export async function GET(request: NextRequest) {
  if (!authorizeRequest(request)) return unauthorizedResponse();

  const household = await getOrCreateHousehold();
  const connected = await hasTescoSession(household.id);

  return NextResponse.json({
    connected,
    hint: connected
      ? null
      : 'Spustite lokálne: npm run tesco:login (jednorazové prihlásenie do Tesco)',
  });
}