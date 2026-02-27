"use client";
<<<<<<< HEAD

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
=======
import type { FilterState } from "@/types";

interface Props { filters: FilterState; onChange: (f: FilterState) => void; }

const CUISINES = ["Italian","French","Japanese","Chinese","Indian","Mexican","Pizza","Burger","Thai","Sushi","Mediterranean","Korean","Vegan","Seafood","Lebanese","Turkish"];

const FieldLabel = ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
    <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"var(--ink-3)" }}>{children}</span>
    {aside && <span style={{ fontSize:11, fontWeight:600, color:"var(--brand)" }}>{aside}</span>}
  </div>
);

export default function FiltersPanel({ filters, onChange }: Props) {
  const u = (p: Partial<FilterState>) => onChange({ ...filters, ...p });
  const hasActive = Object.keys(filters).some(k => k !== "sortBy" && filters[k as keyof FilterState] != null);

  const selectStyle: React.CSSProperties = {
    width:"100%", background:"var(--surface-2)", color:"var(--ink-1)",
    fontSize:13, fontWeight:500, borderRadius:"var(--r-md)",
    padding:"8px 10px", border:"1px solid var(--b2)", outline:"none",
    cursor:"pointer", fontFamily:"inherit", appearance:"none",
  };

  return (
    <div style={{ padding:"14px 14px 16px", background:"var(--surface-1)", display:"flex", flexDirection:"column", gap:14 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, fontWeight:700, letterSpacing:"0.04em", color:"var(--ink-2)" }}>Filter & Sort</span>
        {hasActive && (
          <button
            onClick={() => onChange({ sortBy:"score" })}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, fontWeight:700, color:"var(--brand)", padding:0 }}
          >Clear all</button>
>>>>>>> f265c4a (FinderMaps)
        )}
      </div>

      {/* Sort */}
      <div>
<<<<<<< HEAD
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
=======
        <FieldLabel>Sort by</FieldLabel>
        <select value={filters.sortBy} onChange={e => u({ sortBy: e.target.value as FilterState["sortBy"] })} style={selectStyle}>
          <option value="score">Best match</option>
          <option value="rating">Highest rated</option>
          <option value="distance">Nearest first</option>
          <option value="name">A → Z</option>
>>>>>>> f265c4a (FinderMaps)
        </select>
      </div>

      {/* Min rating */}
      <div>
<<<<<<< HEAD
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
=======
        <FieldLabel aside={filters.minRating ? `${filters.minRating}/10` : "Any"}>
          Min rating
        </FieldLabel>
        <input type="range" min={0} max={10} step={0.5}
          value={filters.minRating ?? 0}
          onChange={e => u({ minRating: +e.target.value > 0 ? +e.target.value : undefined })}
          style={{ width:"100%", accentColor:"var(--brand)", cursor:"pointer", height:4 }}
        />
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
          <span style={{ fontSize:10, color:"var(--ink-4)" }}>0</span>
          <span style={{ fontSize:10, color:"var(--ink-4)" }}>10</span>
        </div>
>>>>>>> f265c4a (FinderMaps)
      </div>

      {/* Price */}
      <div>
<<<<<<< HEAD
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
=======
        <FieldLabel>Max price</FieldLabel>
        <div style={{ display:"flex", gap:5 }}>
          {([undefined, 1, 2, 3, 4] as const).map(p => (
            <button key={p ?? "any"} onClick={() => u({ maxPrice: p })} style={{
              flex:1, padding:"7px 2px", borderRadius:"var(--r-md)", cursor:"pointer",
              fontSize:11, fontWeight:700,
              border:`1.5px solid ${filters.maxPrice === p ? "var(--brand)" : "var(--b2)"}`,
              background: filters.maxPrice === p ? "var(--brand-light)" : "var(--surface-2)",
              color: filters.maxPrice === p ? "var(--brand-text)" : "var(--ink-3)",
              transition:"all var(--t1) ease",
            }}>{p == null ? "All" : "$".repeat(p)}</button>
>>>>>>> f265c4a (FinderMaps)
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div>
<<<<<<< HEAD
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
=======
        <FieldLabel>Cuisine</FieldLabel>
        <select value={filters.cuisine ?? ""} onChange={e => u({ cuisine: e.target.value || undefined })} style={selectStyle}>
          <option value="">All cuisines</option>
          {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
>>>>>>> f265c4a (FinderMaps)
        </select>
      </div>

      {/* Open now */}
<<<<<<< HEAD
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.openNow ?? false}
          onChange={(e) => update({ openNow: e.target.checked || undefined })}
          className="accent-amber-400 w-3.5 h-3.5"
        />
        <span className="text-xs text-stone-300">Open now only</span>
=======
      <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
        <div
          role="switch" aria-checked={!!filters.openNow}
          onClick={() => u({ openNow: filters.openNow ? undefined : true })}
          style={{
            width:38, height:22, borderRadius:11, cursor:"pointer",
            background: filters.openNow ? "var(--brand)" : "var(--surface-4)",
            position:"relative", transition:"background var(--t2) ease", flexShrink:0,
          }}
        >
          <div style={{
            position:"absolute", top:2, left: filters.openNow ? 18 : 2,
            width:18, height:18, borderRadius:"50%",
            background:"white", boxShadow:"var(--s1)",
            transition:"left var(--t2) var(--ease-out)",
          }}/>
        </div>
        <span style={{ fontSize:13, fontWeight:500, color:"var(--ink-2)", userSelect:"none" }}>Open now only</span>
>>>>>>> f265c4a (FinderMaps)
      </label>

      {/* Max distance */}
      <div>
<<<<<<< HEAD
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
=======
        <FieldLabel aside={filters.maxDistance
          ? filters.maxDistance >= 1000 ? `${(filters.maxDistance/1000).toFixed(1)} km` : `${filters.maxDistance}m`
          : "Any"}>
          Max distance
        </FieldLabel>
        <input type="range" min={100} max={5000} step={100}
          value={filters.maxDistance ?? 5000}
          onChange={e => u({ maxDistance: +e.target.value < 5000 ? +e.target.value : undefined })}
          style={{ width:"100%", accentColor:"var(--brand)", cursor:"pointer" }}
>>>>>>> f265c4a (FinderMaps)
        />
      </div>
    </div>
  );
}
