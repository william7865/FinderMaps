// ============================================================
// app/api/osm/overpass/route.ts — GET /api/osm/overpass
// ============================================================
// Query params:
//   bbox    = minLon,minLat,maxLon,maxLat  (required)
//   types   = restaurant,cafe,bar          (optional, default: restaurant)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRestaurantsInBbox } from "@/lib/overpass";
import { cacheAside, buildBboxKey } from "@/lib/cache";
import type { OverpassApiResponse } from "@/types";

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
  }

  const { bbox, types } = parsed.data;
  const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(Number);

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
  }

  const bbox_key = buildBboxKey(minLon, minLat, maxLon, maxLat, types);

  try {
    const { data: places, cached } = await cacheAside(
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
  }
}
