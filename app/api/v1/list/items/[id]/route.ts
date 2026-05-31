import { NextRequest, NextResponse } from 'next/server';

// PATCH /api/v1/list/items/{id}
// Update an item (partial update supported)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Authenticate agent / user
  // TODO: Validate input
  // TODO: Update item in database

  return NextResponse.json(
    { message: "Not implemented yet" },
    { status: 501 }
  );
}

// DELETE /api/v1/list/items/{id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Authenticate + authorize
  // TODO: Delete item

  return NextResponse.json(
    { message: "Not implemented yet" },
    { status: 501 }
  );
}
