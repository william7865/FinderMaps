"use client";

// ============================================================
// app/page.tsx — Main map page
// ============================================================

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import type { PlaceCard, FilterState } from "@/types";
import { useRestaurants } from "@/lib/hooks/useRestaurants";
import FiltersPanel from "@/components/filters/FiltersPanel";
import PlaceList from "@/components/place/PlaceList";
import PlaceDetail from "@/components/place/PlaceDetail";

// Leaflet must be loaded dynamically (no SSR)
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-stone-900 flex items-center justify-center">
      <div className="text-amber-400 font-mono text-sm animate-pulse">Loading map...</div>
    </div>
  ),
});

export default function HomePage() {
  const {
    filteredPlaces,
    loading,
    error,
    fetchRestaurants,
    applyClientFilters,
    toggleFavorite,
  } = useRestaurants();

  const [selectedPlace, setSelectedPlace] = useState<PlaceCard | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ sortBy: "score" });
  const [showFilters, setShowFilters] = useState(false);

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      applyClientFilters(newFilters);
    },
    [applyClientFilters]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-stone-950 text-stone-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center px-4 gap-4 border-b border-stone-800 bg-stone-950/90 backdrop-blur z-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-xl">🍽</span>
          <span className="font-bold text-stone-100 tracking-tight">
            resto<span className="text-amber-400">finder</span>
          </span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            showFilters
              ? "bg-amber-400 text-stone-950"
              : "bg-stone-800 text-stone-300 hover:bg-stone-700"
          }`}
        >
          Filters {Object.keys(filters).filter((k) => k !== "sortBy" && filters[k as keyof FilterState] != null).length > 0 && "•"}
        </button>
        <a
          href="/favorites"
          className="px-3 py-1.5 rounded text-xs font-medium bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
        >
          ♥ Favorites
        </a>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel: list + filters */}
        <div className="w-80 flex flex-col border-r border-stone-800 flex-shrink-0 overflow-hidden">
          {showFilters && (
            <div className="border-b border-stone-800">
              <FiltersPanel filters={filters} onChange={handleFiltersChange} />
            </div>
          )}

          {/* Stats bar */}
          <div className="px-3 py-2 bg-stone-900 border-b border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <span>
              {loading ? (
                <span className="text-amber-400 animate-pulse">Searching…</span>
              ) : (
                <span>{filteredPlaces.length} restaurants</span>
              )}
            </span>
            {error && <span className="text-red-400 truncate ml-2">{error}</span>}
          </div>

          {/* Place list */}
          <div className="flex-1 overflow-y-auto">
            <PlaceList
              places={filteredPlaces}
              selectedId={selectedPlace?.osm_id}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={setSelectedPlace}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            places={filteredPlaces}
            selectedId={selectedPlace?.osm_id}
            hoveredId={hoveredId}
            onMoveEnd={fetchRestaurants}
            onMarkerClick={setSelectedPlace}
            onMarkerHover={setHoveredId}
          />
        </div>
      </div>

      {/* Place detail panel (slide-in) */}
      {selectedPlace && (
        <PlaceDetail
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}
