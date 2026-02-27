<<<<<<< HEAD
// ============================================================
// app/api/osm/overpass/route.ts — GET /api/osm/overpass
// ============================================================
// Query params:
//   bbox    = minLon,minLat,maxLon,maxLat  (required)
//   types   = restaurant,cafe,bar          (optional, default: restaurant)
// ============================================================

=======
>>>>>>> f265c4a (FinderMaps)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRestaurantsInBbox } from "@/lib/overpass";
import { cacheAside, buildBboxKey } from "@/lib/cache";
import type { OverpassApiResponse } from "@/types";

<<<<<<< HEAD
// ---------- Validation schema ----------

const QuerySchema = z.object({
  bbox: z
    .string()
    .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/, "bbox must be minLon,minLat,maxLon,maxLat"),
  types: z
    .string()
    .optional()
    .default("restaurant")
    .transform((s) => s.split(",") as Array<"restaurant" | "cafe" | "bar" | "fast_food">),
});

// Max bbox size to prevent huge Overpass queries (~50km²)
const MAX_BBOX_DEGREES = 0.5;

// ---------- Handler ----------

export async function GET(req: NextRequest): Promise<NextResponse<OverpassApiResponse>> {
  const { searchParams } = new URL(req.url);
  const raw = {
    bbox: searchParams.get("bbox") ?? "",
    types: searchParams.get("types") ?? undefined,
  };

  // Validate
  const parsed = QuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors.map((e) => e.message).join("; ") },
      { status: 400 }
    );
=======
const QuerySchema = z.object({
  bbox: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/),
  types: z.string().optional().default("restaurant")
    .transform((s) => s.split(",") as Array<"restaurant" | "cafe" | "bar" | "fast_food">),
});

const MAX_BBOX_DEGREES = 0.3; // réduit à ~33km — évite trop de résultats
const MIN_BBOX_DEGREES = 0.002;

export async function GET(req: NextRequest): Promise<NextResponse<OverpassApiResponse>> {
  const { searchParams } = new URL(req.url);
  const raw = { bbox: searchParams.get("bbox") ?? "", types: searchParams.get("types") ?? undefined };

  const parsed = QuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid bbox" }, { status: 400 });
>>>>>>> f265c4a (FinderMaps)
  }

  const { bbox, types } = parsed.data;
  const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(Number);
<<<<<<< HEAD

  // Sanity check coordinates
  if (
    minLon >= maxLon ||
    minLat >= maxLat ||
    maxLon - minLon > MAX_BBOX_DEGREES ||
    maxLat - minLat > MAX_BBOX_DEGREES
  ) {
    return NextResponse.json(
      { error: "bbox too large or invalid. Max span: 0.5 degrees." },
      { status: 400 }
    );
=======
  const spanLon = maxLon - minLon;
  const spanLat = maxLat - minLat;

  // Bbox trop petite (carte pas encore rendue) → retour silencieux
  if (spanLon < MIN_BBOX_DEGREES || spanLat < MIN_BBOX_DEGREES) {
    return NextResponse.json({ data: [], count: 0, cached: false });
  }

  // Bbox trop grande → demander de zoomer
  if (spanLon > MAX_BBOX_DEGREES || spanLat > MAX_BBOX_DEGREES) {
    return NextResponse.json({ error: "Zoom in to search.", data: [], count: 0 }, { status: 200 });
>>>>>>> f265c4a (FinderMaps)
  }

  const bbox_key = buildBboxKey(minLon, minLat, maxLon, maxLat, types);

  try {
    const { data: places, cached } = await cacheAside(
<<<<<<< HEAD
      bbox_key,
      600, // 10 minutes TTL
      () => getRestaurantsInBbox({ minLon, minLat, maxLon, maxLat, includeTypes: types })
    );

    return NextResponse.json(
      {
        data: places,
        count: places.length,
        cached,
        bbox_key,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
          "X-Cache": cached ? "HIT" : "MISS",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/osm/overpass] Error:", message);
    return NextResponse.json(
      { error: `Overpass query failed: ${message}` },
      { status: 502 }
    );
=======
      bbox_key, 600,
      () => getRestaurantsInBbox({ minLon, minLat, maxLon, maxLat, includeTypes: types })
    );

    // Limite à 200 résultats max pour ne pas surcharger la carte
    const limited = places.slice(0, 200);

    return NextResponse.json({ data: limited, count: limited.length, cached, bbox_key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Overpass failed: ${message}` }, { status: 502 });
>>>>>>> f265c4a (FinderMaps)
  }
}
