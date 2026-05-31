import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/history
// List archived lists for the household
export async function GET(request: NextRequest) {
  // TODO: Auth + query params (limit, offset)
  // TODO: Fetch from database

  return NextResponse.json(
    { message: "Not implemented yet" },
    { status: 501 }
  );
}
