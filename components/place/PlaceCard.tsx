"use client";

// ============================================================
// components/place/PlaceCard.tsx — Single place in the list
// ============================================================

import type { PlaceCard as PlaceCardType } from "@/types";
import { getFsqPhotoUrl } from "@/lib/foursquare";

interface Props {
  place: PlaceCardType;
  isSelected: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  onToggleFavorite: () => void;
}

function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 8 ? "bg-green-500" : rating >= 6 ? "bg-amber-400" : "bg-red-400";
  return (
    <span className={`${color} text-stone-950 text-xs font-bold px-1.5 py-0.5 rounded`}>
      {rating.toFixed(1)}
    </span>
  );
}

function PriceTag({ price }: { price: number }) {
  return (
    <span className="text-stone-400 text-xs">
      {"$".repeat(price)}
      <span className="opacity-30">{"$".repeat(4 - price)}</span>
    </span>
  );
}

function DistanceTag({ distance }: { distance: number }) {
  const label =
    distance < 1000
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`;
  return <span className="text-stone-500 text-xs">{label}</span>;
}

export default function PlaceCard({
  place,
  isSelected,
  isHovered,
  onHover,
  onLeave,
  onClick,
  onToggleFavorite,
}: Props) {
  const photo = place.fsq?.photos?.[0];
  const photoUrl = photo ? getFsqPhotoUrl(photo, "80x80") : null;

  return (
    <li
      className={`flex gap-3 p-3 cursor-pointer transition-colors ${
        isSelected
          ? "bg-amber-400/10 border-l-2 border-amber-400"
          : isHovered
          ? "bg-stone-800/60"
          : "hover:bg-stone-800/40"
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Photo or placeholder */}
      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-stone-800">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={place.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">
            🍽
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-sm font-medium text-stone-100 truncate">{place.name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`flex-shrink-0 text-sm transition-colors ${
              place.is_favorite ? "text-purple-400" : "text-stone-600 hover:text-stone-400"
            }`}
            title={place.is_favorite ? "Remove from favorites" : "Add to favorites"}
          >
            ♥
          </button>
        </div>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {place.cuisine && (
            <span className="text-xs text-amber-400/80">{place.cuisine}</span>
          )}
          {place.fsq?.categories?.[0] && !place.cuisine && (
            <span className="text-xs text-amber-400/80">{place.fsq.categories[0].name}</span>
          )}
          {place.open_now !== undefined && (
            <span
              className={`text-xs ${place.open_now ? "text-green-400" : "text-red-400"}`}
            >
              {place.open_now ? "Open" : "Closed"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {place.fsq?.rating != null && <RatingBadge rating={place.fsq.rating} />}
          {place.fsq?.total_ratings != null && (
            <span className="text-xs text-stone-500">{place.fsq.total_ratings} reviews</span>
          )}
          {place.fsq?.price != null && <PriceTag price={place.fsq.price} />}
          {place.distance != null && <DistanceTag distance={place.distance} />}
        </div>
      </div>
    </li>
  );
}
