// ============================================================
<<<<<<< HEAD
// lib/hooks/useRestaurants.ts — Main data fetching hook
// ============================================================

"use client";

import { useState, useCallback, useRef } from "react";
import type { PlaceCard, FilterState } from "@/types";
import { annotateDistances, annotateScores, applyFilters } from "@/lib/scoring";

interface BBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  centerLat: number;
  centerLon: number;
}

interface UseRestaurantsReturn {
  places: PlaceCard[];
  filteredPlaces: PlaceCard[];
  loading: boolean;
  error: string | null;
  fetchRestaurants: (bbox: BBox) => Promise<void>;
  applyClientFilters: (filters: FilterState) => void;
  favoriteIds: Set<string>;
  toggleFavorite: (place: PlaceCard) => Promise<void>;
}

export function useRestaurants(): UseRestaurantsReturn {
  const [places, setPlaces] = useState<PlaceCard[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<PlaceCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const currentFilters = useRef<FilterState>({ sortBy: "score" });

  const fetchRestaurants = useCallback(async (bbox: BBox) => {
=======
// lib/hooks/useRestaurants.ts — v4
//   ROOT CAUSE FIX: favoriteIds starts as new Set() on every
//   mount. When the user navigates to /favorites and back, the
//   hook re-mounts and loses all in-memory state, making every
//   place show is_favorite: false — even though the DB is fine.
//
//   FIX: useEffect on mount fetches /api/favorites and
//   pre-populates favoriteIds + re-annotates any already-loaded
//   places so hearts appear immediately on return.
// ============================================================
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { PlaceCard, FilterState, PlaceBase, FavoriteRow } from "@/types";
import { annotateDistances, annotateScores, applyFilters } from "@/lib/scoring";

interface BBox {
  minLon: number; minLat: number; maxLon: number; maxLat: number;
  centerLat: number; centerLon: number;
}

const REFETCH_THRESHOLD = 0.004;

function bboxChanged(prev: BBox | null, next: BBox): boolean {
  if (!prev) return true;
  return (
    Math.abs(prev.minLon - next.minLon) > REFETCH_THRESHOLD ||
    Math.abs(prev.minLat - next.minLat) > REFETCH_THRESHOLD ||
    Math.abs(prev.maxLon - next.maxLon) > REFETCH_THRESHOLD ||
    Math.abs(prev.maxLat - next.maxLat) > REFETCH_THRESHOLD
  );
}

export function useRestaurants() {
  const [places,         setPlaces]         = useState<PlaceCard[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<PlaceCard[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [enriching,      setEnriching]      = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [favoriteIds,    setFavoriteIds]    = useState<Set<string>>(new Set());

  const currentFilters = useRef<FilterState>({ sortBy: "score" });
  const lastBbox       = useRef<BBox | null>(null);
  const fetchCount     = useRef(0);

  // ── Restore favourites from DB on every mount ──────────────
  // Next.js navigation unmounts/remounts this hook, clearing the
  // in-memory Set. This effect restores it from the API so that
  // hearts survive /favorites → / navigation.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/favorites")
      .then(r => r.ok ? r.json() : null)
      .then((data: { data?: FavoriteRow[] } | null) => {
        if (cancelled || !data?.data) return;

        const ids = new Set(data.data.map(row => row.osm_id));

        setFavoriteIds(ids);

        // Re-annotate places already in state (race: map may load before API reply)
        const reannotate = (arr: PlaceCard[]) =>
          arr.length > 0
            ? arr.map(p => ({ ...p, is_favorite: ids.has(p.osm_id) }))
            : arr;

        setPlaces(reannotate);
        setFilteredPlaces(reannotate);
      })
      .catch(() => {
        // Silently ignore — hearts just won't pre-populate if API is down
      });

    return () => { cancelled = true; };
  }, []); // intentionally empty — run once on mount only

  // ── Core fetch ─────────────────────────────────────────────
  const fetchRestaurants = useCallback(async (bbox: BBox) => {
    if (!bboxChanged(lastBbox.current, bbox)) return;
    lastBbox.current = bbox;

    const myFetch = ++fetchCount.current;
>>>>>>> f265c4a (FinderMaps)
    setLoading(true);
    setError(null);

    try {
<<<<<<< HEAD
      // 1. Fetch OSM places
      const osmRes = await fetch(
        `/api/osm/overpass?bbox=${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`
      );
      if (!osmRes.ok) throw new Error(`OSM fetch failed: ${osmRes.status}`);
      const osmData = await osmRes.json();
      const osmPlaces = osmData.data ?? [];

      if (osmPlaces.length === 0) {
        setPlaces([]);
        setFilteredPlaces([]);
        return;
      }

      // 2. Enrich in batches of 20 (to avoid request size limits)
      const BATCH = 20;
      let enriched: PlaceCard[] = [];

      for (let i = 0; i < osmPlaces.length; i += BATCH) {
        const batch = osmPlaces.slice(i, i + BATCH);
        try {
          const enrichRes = await fetch("/api/places/enrich", {
=======
      const osmRes = await fetch(
        `/api/osm/overpass?bbox=${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`
      );
      if (!osmRes.ok) throw new Error(`OSM ${osmRes.status}`);
      const osmData = await osmRes.json();
      const osmPlaces: PlaceBase[] = osmData.data ?? [];

      if (fetchCount.current !== myFetch) return;
      if (!osmPlaces.length) {
        setPlaces([]); setFilteredPlaces([]); setLoading(false); return;
      }

      const raw = annotateScores(
        annotateDistances(
          osmPlaces.map(p => ({ ...p, is_favorite: favoriteIds.has(p.osm_id) })),
          bbox.centerLat, bbox.centerLon
        )
      );
      setPlaces(raw);
      setFilteredPlaces(applyFilters(raw, currentFilters.current));
      setLoading(false);
      setEnriching(true);

      const FIRST_BATCH = 20;
      const REST_BATCH  = 30;
      const batches: PlaceBase[][] = [
        osmPlaces.slice(0, FIRST_BATCH),
        ...chunk(osmPlaces.slice(FIRST_BATCH), REST_BATCH),
      ];

      let enriched: PlaceCard[] = [];

      for (const batch of batches) {
        if (fetchCount.current !== myFetch) return;

        try {
          const res = await fetch("/api/places/enrich", {
>>>>>>> f265c4a (FinderMaps)
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ places: batch }),
          });
<<<<<<< HEAD
          if (enrichRes.ok) {
            const enrichData = await enrichRes.json();
            enriched = enriched.concat(enrichData.data ?? batch);
          } else {
            enriched = enriched.concat(batch);
          }
        } catch {
          enriched = enriched.concat(batch);
        }
      }

      // 3. Annotate with distance + score
      const withDistance = annotateDistances(enriched, bbox.centerLat, bbox.centerLon);
      const withScore = annotateScores(withDistance);

      // 4. Mark favorites
      const withFavorites = withScore.map((p) => ({
        ...p,
        is_favorite: favoriteIds.has(p.osm_id),
      }));

      setPlaces(withFavorites);
      setFilteredPlaces(applyFilters(withFavorites, currentFilters.current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  }, [favoriteIds]);

  const applyClientFilters = useCallback(
    (filters: FilterState) => {
      currentFilters.current = filters;
      setFilteredPlaces(applyFilters(places, filters));
    },
    [places]
  );

  const toggleFavorite = useCallback(
    async (place: PlaceCard) => {
      const isFav = favoriteIds.has(place.osm_id);
      try {
        if (isFav) {
          await fetch(`/api/favorites/${encodeURIComponent(place.osm_id)}`, {
            method: "DELETE",
          });
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(place.osm_id);
            return next;
          });
        } else {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ place }),
          });
          setFavoriteIds((prev) => new Set([...prev, place.osm_id]));
        }
        // Update in-place
        setPlaces((prev) =>
          prev.map((p) =>
            p.osm_id === place.osm_id ? { ...p, is_favorite: !isFav } : p
          )
        );
      } catch (err) {
        console.error("toggleFavorite error:", err);
      }
    },
    [favoriteIds]
  );

  return {
    places,
    filteredPlaces,
    loading,
    error,
    fetchRestaurants,
    applyClientFilters,
    favoriteIds,
    toggleFavorite,
  };
}
=======
          const data = await res.json();
          enriched = enriched.concat(data.data ?? batch);
        } catch {
          enriched = enriched.concat(batch);
        }

        if (fetchCount.current !== myFetch) return;
        const combined = osmPlaces.map(orig => {
          const found = enriched.find(e => e.osm_id === orig.osm_id);
          return found ?? { ...orig, is_favorite: favoriteIds.has(orig.osm_id) };
        });
        const scored  = annotateScores(annotateDistances(combined, bbox.centerLat, bbox.centerLon));
        const withFav = scored.map(p => ({ ...p, is_favorite: favoriteIds.has(p.osm_id) }));
        setPlaces(withFav);
        setFilteredPlaces(applyFilters(withFav, currentFilters.current));
      }

    } catch (err) {
      if (fetchCount.current === myFetch) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    } finally {
      if (fetchCount.current === myFetch) {
        setLoading(false);
        setEnriching(false);
      }
    }
  }, [favoriteIds]);

  // ── Client-side filter ─────────────────────────────────────
  const applyClientFilters = useCallback((filters: FilterState) => {
    currentFilters.current = filters;
    setFilteredPlaces(applyFilters(places, filters));
  }, [places]);

  // ── Favourite toggle ────────────────────────────────────────
  const toggleFavorite = useCallback(async (place: PlaceCard) => {
    const isFav = favoriteIds.has(place.osm_id);

    const flip = (arr: PlaceCard[]) =>
      arr.map(p => p.osm_id === place.osm_id ? { ...p, is_favorite: !isFav } : p);

    // Optimistic update — both arrays so list re-renders immediately
    setFavoriteIds(prev => {
      const next = new Set(prev);
      isFav ? next.delete(place.osm_id) : next.add(place.osm_id);
      return next;
    });
    setPlaces(flip);
    setFilteredPlaces(flip);

    try {
      if (isFav) {
        await fetch(`/api/favorites/${encodeURIComponent(place.osm_id)}`, { method: "DELETE" });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ place }),
        });
      }
    } catch {
      // Rollback on network error
      const revert = (arr: PlaceCard[]) =>
        arr.map(p => p.osm_id === place.osm_id ? { ...p, is_favorite: isFav } : p);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        isFav ? next.add(place.osm_id) : next.delete(place.osm_id);
        return next;
      });
      setPlaces(revert);
      setFilteredPlaces(revert);
    }
  }, [favoriteIds]);

  return {
    places, filteredPlaces, loading, enriching, error,
    fetchRestaurants, applyClientFilters, favoriteIds, toggleFavorite,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
>>>>>>> f265c4a (FinderMaps)
