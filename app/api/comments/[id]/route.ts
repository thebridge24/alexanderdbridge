import { NextRequest } from "next/server";
import { editOwnedRow, deleteOwnedRow } from "@/lib/comments/ownedRows";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return editOwnedRow(request, "devotional_comments", id);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return deleteOwnedRow(request, "devotional_comments", id);
}
