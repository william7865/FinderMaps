// ============================================================
// app/api/favorites/[osmId]/route.ts — DELETE /api/favorites/:osmId
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { removeFavorite } from "@/lib/db";

const DEMO_USER_ID = "demo-user";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { osmId: string } }
) {
  try {
    const osmId = decodeURIComponent(params.osmId);
    await removeFavorite(DEMO_USER_ID, osmId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
