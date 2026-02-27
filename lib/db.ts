// ============================================================
// lib/db.ts — Supabase client + DB helpers
// ============================================================

import { createClient } from "@supabase/supabase-js";
import type { FavoriteRow, OsmFsqMapping, PlaceCard } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side only client (service role — never expose to client)
export const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ---------- Favorites ----------

export async function getFavorites(userId: string): Promise<FavoriteRow[]> {
  const { data, error } = await db
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as FavoriteRow[];
}

export async function addFavorite(
  userId: string,
  place: PlaceCard
): Promise<FavoriteRow> {
  const row = {
    user_id: userId,
    osm_id: place.osm_id,
    name: place.name,
    lat: place.lat,
    lon: place.lon,
    fsq_id: place.fsq?.fsq_id,
    snapshot: place,
  };

  const { data, error } = await db
    .from("favorites")
    .upsert(row, { onConflict: "user_id,osm_id" })
    .select()
    .single();

  if (error) throw error;
  return data as FavoriteRow;
}

export async function removeFavorite(userId: string, osmId: string): Promise<void> {
  const { error } = await db
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("osm_id", osmId);

  if (error) throw error;
}

// ---------- OSM ↔ FSQ mapping ----------

export async function getFsqMapping(osmId: string): Promise<OsmFsqMapping | null> {
  const { data } = await db
    .from("osm_fsq_mapping")
    .select("*")
    .eq("osm_id", osmId)
    .maybeSingle();

  return data as OsmFsqMapping | null;
}

export async function saveFsqMapping(
  osmId: string,
  fsqId: string,
  confidence: number
): Promise<void> {
  await db.from("osm_fsq_mapping").upsert(
    { osm_id: osmId, fsq_id: fsqId, confidence, matched_at: new Date().toISOString() },
    { onConflict: "osm_id" }
  );
}
