import { NextRequest } from 'next/server';

// Very simple API key check for development / Hermes
// In production this should validate against the AgentCredential table
export function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);

  // For development: accept any key starting with "ga_" or use env variable
  const validKey = process.env.GROCER_AGENT_API_KEY || 'ga_dev_key_123';

  return token === validKey;
}
