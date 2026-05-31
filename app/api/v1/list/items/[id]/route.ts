import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/v1/list/items/{id}
// Update an item (partial update supported)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: Authenticate agent / user
  // TODO: Validate input
  // TODO: Update item in database
  void request;
  void id;

  return NextResponse.json(
    { message: "Not implemented yet" },
    { status: 501 }
  );
}

// DELETE /api/v1/list/items/{id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // TODO: Authenticate + authorize
  // TODO: Delete item
  void request;
  void id;

  return NextResponse.json(
    { message: "Not implemented yet" },
    { status: 501 }
  );
}
