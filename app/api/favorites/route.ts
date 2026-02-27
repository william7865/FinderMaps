// ============================================================
// app/api/favorites/route.ts — GET + POST /api/favorites
<<<<<<< HEAD
=======
// Uses real userId from Supabase session cookie, falls back to
// "demo-user" for unauthenticated users (optional feature)
>>>>>>> f265c4a (FinderMaps)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
<<<<<<< HEAD
import { getFavorites, addFavorite } from "@/lib/db";

// For demo: we use a hardcoded userId. In production, extract from session/JWT.
const DEMO_USER_ID = "demo-user";

export async function GET() {
  try {
    const favorites = await getFavorites(DEMO_USER_ID);
=======
import { createClient } from "@supabase/supabase-js";
import { getFavorites, addFavorite } from "@/lib/db";

const FALLBACK_USER = "demo-user";

/** Extract userId from Supabase JWT cookie (server-side) */
async function getUserId(req: NextRequest): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Read the auth token from cookie
    const authCookie = req.cookies.get("sb-access-token")?.value
      ?? req.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`)?.value;

    if (!authCookie) return FALLBACK_USER;

    const { data: { user }, error } = await supabase.auth.getUser(authCookie);
    if (error || !user) return FALLBACK_USER;
    return user.id;
  } catch {
    return FALLBACK_USER;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const favorites = await getFavorites(userId);
>>>>>>> f265c4a (FinderMaps)
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
<<<<<<< HEAD
  }).passthrough(), // allow extra fields (full PlaceCard)
=======
  }).passthrough(),
>>>>>>> f265c4a (FinderMaps)
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = AddFavoriteSchema.safeParse(body);
<<<<<<< HEAD
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await addFavorite(DEMO_USER_ID, parsed.data.place as any);
=======
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const userId = await getUserId(req);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await addFavorite(userId, parsed.data.place as any);
>>>>>>> f265c4a (FinderMaps)
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
