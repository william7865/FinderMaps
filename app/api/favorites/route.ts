// ============================================================
// app/api/favorites/route.ts — GET + POST /api/favorites
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFavorites, addFavorite } from "@/lib/db";

// For demo: we use a hardcoded userId. In production, extract from session/JWT.
const DEMO_USER_ID = "demo-user";

export async function GET() {
  try {
    const favorites = await getFavorites(DEMO_USER_ID);
    return NextResponse.json({ data: favorites });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

const AddFavoriteSchema = z.object({
  place: z.object({
    osm_id: z.string(),
    osm_type: z.enum(["node", "way", "relation"]),
    name: z.string(),
    lat: z.number(),
    lon: z.number(),
    tags: z.record(z.string()),
  }).passthrough(), // allow extra fields (full PlaceCard)
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = AddFavoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await addFavorite(DEMO_USER_ID, parsed.data.place as any);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
