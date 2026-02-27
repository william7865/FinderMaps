"use client";

// ============================================================
// components/filters/FiltersPanel.tsx — Filter controls
// ============================================================

import { useState } from "react";
import type { FilterState } from "@/types";

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const CUISINES = [
  "Italian", "French", "Japanese", "Chinese", "Indian", "Mexican",
  "Pizza", "Burger", "Thai", "Sushi", "Mediterranean", "Kebab",
  "Korean", "Vegetarian", "Seafood",
];

export default function FiltersPanel({ filters, onChange }: Props) {
  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });
  const clear = () => onChange({ sortBy: "score" });

  const hasActive = Object.keys(filters).some(
    (k) => k !== "sortBy" && filters[k as keyof FilterState] != null
  );

  return (
    <div className="p-3 space-y-3 bg-stone-950">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
          Filters
        </span>
        {hasActive && (
          <button
            onClick={clear}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">Sort by</label>
        <select
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as FilterState["sortBy"] })}
          className="w-full bg-stone-800 text-stone-200 text-xs rounded px-2 py-1.5 border border-stone-700 focus:outline-none focus:border-amber-400"
        >
          <option value="score">Best match</option>
          <option value="rating">Rating</option>
          <option value="distance">Distance</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Min rating */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">
          Min rating: {filters.minRating != null ? `${filters.minRating}/10` : "Any"}
        </label>
        <input
          type="range"
          min={0}
          max={10}
          step={0.5}
          value={filters.minRating ?? 0}
          onChange={(e) =>
            update({
              minRating: Number(e.target.value) > 0 ? Number(e.target.value) : undefined,
            })
          }
          className="w-full accent-amber-400"
        />
      </div>

      {/* Price */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">Max price</label>
        <div className="flex gap-1">
          {([undefined, 1, 2, 3, 4] as Array<1 | 2 | 3 | 4 | undefined>).map((p) => (
            <button
              key={p ?? "any"}
              onClick={() => update({ maxPrice: p })}
              className={`flex-1 py-1 text-xs rounded transition-colors ${
                filters.maxPrice === p
                  ? "bg-amber-400 text-stone-950 font-bold"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              }`}
            >
              {p == null ? "Any" : "$".repeat(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">Cuisine</label>
        <select
          value={filters.cuisine ?? ""}
          onChange={(e) => update({ cuisine: e.target.value || undefined })}
          className="w-full bg-stone-800 text-stone-200 text-xs rounded px-2 py-1.5 border border-stone-700 focus:outline-none focus:border-amber-400"
        >
          <option value="">All cuisines</option>
          {CUISINES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Open now */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.openNow ?? false}
          onChange={(e) => update({ openNow: e.target.checked || undefined })}
          className="accent-amber-400 w-3.5 h-3.5"
        />
        <span className="text-xs text-stone-300">Open now only</span>
      </label>

      {/* Max distance */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">
          Max distance:{" "}
          {filters.maxDistance != null
            ? filters.maxDistance >= 1000
              ? `${(filters.maxDistance / 1000).toFixed(1)}km`
              : `${filters.maxDistance}m`
            : "Any"}
        </label>
        <input
          type="range"
          min={100}
          max={5000}
          step={100}
          value={filters.maxDistance ?? 5000}
          onChange={(e) =>
            update({
              maxDistance: Number(e.target.value) < 5000 ? Number(e.target.value) : undefined,
            })
          }
          className="w-full accent-amber-400"
        />
      </div>
    </div>
  );
}
