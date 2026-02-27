"use client";

// ============================================================
// components/place/PlaceList.tsx — Scrollable restaurant list
// ============================================================

import type { PlaceCard } from "@/types";
import PlaceCard from "./PlaceCard";

interface PlaceListProps {
  places: PlaceCard[];
  selectedId?: string;
  hoveredId?: string | null;
  onHover: (id: string | null) => void;
  onSelect: (place: PlaceCard) => void;
  onToggleFavorite: (place: PlaceCard) => void;
}

export default function PlaceList({
  places,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onToggleFavorite,
}: PlaceListProps) {
  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-stone-500 text-sm gap-2">
        <span className="text-2xl">🗺️</span>
        <span>Move the map to discover restaurants</span>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-stone-800">
      {places.map((place) => (
        <PlaceCard
          key={place.osm_id}
          place={place}
          isSelected={place.osm_id === selectedId}
          isHovered={place.osm_id === hoveredId}
          onHover={() => onHover(place.osm_id)}
          onLeave={() => onHover(null)}
          onClick={() => onSelect(place)}
          onToggleFavorite={() => onToggleFavorite(place)}
        />
      ))}
    </ul>
  );
}
