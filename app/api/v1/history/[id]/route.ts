import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/history/{id}
// Get full details of one archived list
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Auth + fetch archived list with items

  return NextResponse.json(
    { message: "Not implemented yet" },
    { status: 501 }
  );
}
