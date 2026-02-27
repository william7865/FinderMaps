// ============================================================
// app/api/favorites/route.ts — GET + POST /api/favorites
// Uses real userId from Supabase session cookie, falls back to
// "demo-user" for unauthenticated users (optional feature)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
  }).passthrough(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = AddFavoriteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const userId = await getUserId(req);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await addFavorite(userId, parsed.data.place as any);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
