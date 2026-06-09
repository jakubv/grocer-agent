import { NextRequest } from 'next/server';

export function getAccessToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const header = request.headers.get('x-ga-token');
  return header?.trim() || null;
}

export function getExpectedAccessToken(): string {
  return (
    process.env.GA_ACCESS_TOKEN ||
    process.env.GROCER_AGENT_API_KEY ||
    'ga_dev_key_123'
  );
}

export function authorizeRequest(request: NextRequest): boolean {
  const token = getAccessToken(request);
  if (!token) return false;
  return token === getExpectedAccessToken();
}

export function unauthorizedResponse() {
  return Response.json(
    { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing access token' } },
    { status: 401 }
  );
}