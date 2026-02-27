"use client";

// app/(pages)/favorites/page.tsx — Favorites list page

import { useEffect, useState } from "react";
import type { FavoriteRow } from "@/types";
import Link from "next/link";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setFavorites(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (osmId: string) => {
    await fetch(`/api/favorites/${encodeURIComponent(osmId)}`, { method: "DELETE" });
    setFavorites((prev) => prev.filter((f) => f.osm_id !== osmId));
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-amber-400 hover:text-amber-300 text-sm">
            ← Map
          </Link>
          <h1 className="text-xl font-bold">
            ♥ My Favorites <span className="text-stone-500 font-normal text-base">({favorites.length})</span>
          </h1>
        </div>

        {loading && (
          <div className="text-stone-400 text-sm animate-pulse">Loading…</div>
        )}

        {!loading && favorites.length === 0 && (
          <div className="text-center py-20 text-stone-500">
            <div className="text-4xl mb-3">🍽</div>
            <p>No favorites yet.</p>
            <Link href="/" className="text-amber-400 hover:underline text-sm">
              Discover restaurants →
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {favorites.map((fav) => (
            <li
              key={fav.id}
              className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-start justify-between gap-3"
            >
              <div>
                <h3 className="font-semibold text-stone-100">{fav.name}</h3>
                {fav.snapshot.cuisine && (
                  <p className="text-amber-400 text-sm">{fav.snapshot.cuisine}</p>
                )}
                {fav.snapshot.address && (
                  <p className="text-stone-500 text-xs mt-1">{fav.snapshot.address}</p>
                )}
                <p className="text-stone-600 text-xs mt-1">
                  Saved {new Date(fav.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => remove(fav.osm_id)}
                className="text-stone-600 hover:text-red-400 transition-colors flex-shrink-0"
                title="Remove from favorites"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
