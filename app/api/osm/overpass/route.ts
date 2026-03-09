import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRestaurantsInBbox } from "@/lib/overpass";
import { cacheAside, buildBboxKey } from "@/lib/cache";
import type { OverpassApiResponse } from "@/types";

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
  }

  const { bbox, types } = parsed.data;
  const [minLon, minLat, maxLon, maxLat] = bbox.split(",").map(Number);
  const spanLon = maxLon - minLon;
  const spanLat = maxLat - minLat;

  // Bbox trop petite (carte pas encore rendue) → retour silencieux
  if (spanLon < MIN_BBOX_DEGREES || spanLat < MIN_BBOX_DEGREES) {
    return NextResponse.json({ data: [], count: 0, cached: false });
  }

  // Bbox trop grande → demander de zoomer
  if (spanLon > MAX_BBOX_DEGREES || spanLat > MAX_BBOX_DEGREES) {
    return NextResponse.json({ error: "Zoom in to search.", data: [], count: 0 }, { status: 200 });
  }

  const bbox_key = buildBboxKey(minLon, minLat, maxLon, maxLat, types);

  try {
    const { data: places, cached } = await cacheAside(
      bbox_key, 600,
      () => getRestaurantsInBbox({ minLon, minLat, maxLon, maxLat, includeTypes: types })
    );

    // Limite à 200 résultats max pour ne pas surcharger la carte
    const limited = places.slice(0, 200);

    return NextResponse.json({ data: limited, count: limited.length, cached, bbox_key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Overpass failed: ${message}` }, { status: 502 });
  }
}
