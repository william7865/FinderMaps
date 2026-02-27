// ============================================================
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
    setLoading(true);
    setError(null);

    try {
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
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ places: batch }),
          });
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
