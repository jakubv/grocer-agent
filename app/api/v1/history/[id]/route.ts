import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/history/{id}
// Get full details of one archived list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: Auth + fetch archived list with items
  void request;
  void id;

  return NextResponse.json(
    { message: "Not implemented yet" },
    { status: 501 }
  );
}
