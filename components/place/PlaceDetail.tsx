"use client";

// ============================================================
// components/place/PlaceDetail.tsx — Slide-in detail panel
// ============================================================

import type { PlaceCard } from "@/types";
import { getFsqPhotoUrl } from "@/lib/foursquare";

interface Props {
  place: PlaceCard;
  onClose: () => void;
  onToggleFavorite: (place: PlaceCard) => void;
}

export default function PlaceDetail({ place, onClose, onToggleFavorite }: Props) {
  const photos = place.fsq?.photos ?? [];
  const mainPhoto = photos[0] ? getFsqPhotoUrl(photos[0], "600x400") : null;

  return (
    <div className="fixed bottom-0 right-0 w-96 max-h-[70vh] bg-stone-900 border-l border-t border-stone-700 rounded-tl-xl shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header image */}
      {mainPhoto && (
        <div className="h-40 relative flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mainPhoto} alt={place.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent" />
        </div>
      )}

      {/* Top bar */}
      <div className={`flex items-start justify-between px-4 pt-3 ${mainPhoto ? "-mt-8 relative" : ""}`}>
        <div>
          <h2 className="text-lg font-bold text-stone-100 leading-tight">{place.name}</h2>
          {place.cuisine && (
            <p className="text-amber-400 text-sm">{place.cuisine}</p>
          )}
          {!place.cuisine && place.fsq?.categories?.[0] && (
            <p className="text-amber-400 text-sm">{place.fsq.categories[0].name}</p>
          )}
        </div>
        <div className="flex gap-2 ml-2 flex-shrink-0">
          <button
            onClick={() => onToggleFavorite(place)}
            className={`text-lg transition-colors ${
              place.is_favorite ? "text-purple-400" : "text-stone-500 hover:text-stone-300"
            }`}
          >
            ♥
          </button>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-lg">
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap mt-2">
          {place.fsq?.rating != null && (
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-sm">★</span>
              <span className="text-stone-100 font-semibold">{place.fsq.rating.toFixed(1)}</span>
              <span className="text-stone-400 text-xs">/10</span>
              {place.fsq.total_ratings && (
                <span className="text-stone-500 text-xs">({place.fsq.total_ratings})</span>
              )}
            </div>
          )}
          {place.fsq?.price != null && (
            <span className="text-stone-300 text-sm">
              {"$".repeat(place.fsq.price)}
              <span className="opacity-30">{"$".repeat(4 - place.fsq.price)}</span>
            </span>
          )}
          {place.open_now !== undefined && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                place.open_now
                  ? "bg-green-900/50 text-green-400"
                  : "bg-red-900/50 text-red-400"
              }`}
            >
              {place.open_now ? "Open now" : "Closed"}
            </span>
          )}
          {place.distance != null && (
            <span className="text-stone-500 text-xs">
              {place.distance < 1000
                ? `${Math.round(place.distance)}m away`
                : `${(place.distance / 1000).toFixed(1)}km away`}
            </span>
          )}
        </div>

        {/* Description */}
        {place.fsq?.description && (
          <p className="text-stone-400 text-sm leading-relaxed">{place.fsq.description}</p>
        )}

        {/* Hours */}
        {place.fsq?.hours?.display && (
          <div className="bg-stone-800/60 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
              Hours
            </h4>
            <p className="text-stone-300 text-sm">{place.fsq.hours.display}</p>
          </div>
        )}

        {/* Address */}
        {place.address && (
          <div className="flex items-start gap-2">
            <span className="text-stone-500 mt-0.5">📍</span>
            <p className="text-stone-300 text-sm">{place.address}</p>
          </div>
        )}

        {/* Contact */}
        <div className="space-y-1">
          {(place.fsq?.website ?? place.website) && (
            <a
              href={place.fsq?.website ?? place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm transition-colors"
            >
              <span>🔗</span>
              <span className="truncate">{(place.fsq?.website ?? place.website)?.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
          {(place.fsq?.tel ?? place.phone) && (
            <a
              href={`tel:${place.fsq?.tel ?? place.phone}`}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
            >
              <span>📞</span>
              <span>{place.fsq?.tel ?? place.phone}</span>
            </a>
          )}
        </div>

        {/* OSM link */}
        <a
          href={`https://www.openstreetmap.org/${place.osm_type}/${place.osm_id.split("/")[1]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-stone-600 hover:text-stone-400 transition-colors block"
        >
          View on OpenStreetMap →
        </a>
      </div>
    </div>
  );
}
