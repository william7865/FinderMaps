<<<<<<< HEAD
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
=======
// PlaceCard — 88px height for virtual list
// Premium redesign: airy layout, clear hierarchy, favourite state
"use client";
import { memo, useState, useCallback } from "react";
import type { PlaceCard as T } from "@/types";
import HeartButton from "@/components/ui/HeartButton";

interface Props {
  place: T; isSelected: boolean; isHovered: boolean; index: number;
  onHover:()=>void; onLeave:()=>void; onClick:()=>void; onToggleFavorite:()=>void;
}

// ── Inline icons (no dep) ─────────────────────────────────
const IcoStar = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoWalk = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"/><path d="m9 20 3-7 3 7M6 8l6 2 2-3"/>
  </svg>
);

export const ITEM_HEIGHT = 88;

const PlaceCard = memo(function PlaceCard({
  place, isSelected, isHovered, index, onHover, onLeave, onClick, onToggleFavorite
}: Props) {
  const [pressing, setPressing] = useState(false);

  const cuisine = place.cuisine ?? place.fsq?.categories?.[0]?.name;
  const rating  = place.fsq?.rating;
  const price   = place.fsq?.price;
  const isFav   = !!place.is_favorite;

  const ratingColor = rating == null ? "var(--ink-3)"
    : rating >= 8 ? "#1b7f4f"
    : rating >= 6 ? "var(--brand)"
    : "#c53030";

  const handleClick = useCallback(() => {
    setPressing(true);
    setTimeout(() => setPressing(false), 160);
    onClick();
  }, [onClick]);

  // Background states with favourite golden tint
  let bg = "var(--surface-1)";
  if (isSelected) bg = "linear-gradient(105deg, #fff5f0 0%, #fff8f5 100%)";
  else if (isFav && isHovered) bg = "linear-gradient(105deg, #fffbf0 0%, #fdf8ee 100%)";
  else if (isFav) bg = "linear-gradient(105deg, #fffdf7 0%, var(--surface-1) 100%)";
  else if (isHovered) bg = "#faf8f5";

  const borderLeftColor = isSelected ? "var(--brand)" : isFav ? "#d4880a" : "transparent";

  return (
    <div
      role="button" tabIndex={0}
      aria-label={`Select ${place.name}`}
      style={{
        height: ITEM_HEIGHT, boxSizing: "border-box",
        padding: "0 16px 0 13px",
        cursor: "pointer",
        display: "flex", alignItems: "center", gap: 11,
        background: bg,
        borderLeft: `3px solid ${borderLeftColor}`,
        borderBottom: "1px solid rgba(28,25,23,0.06)",
        transform: pressing ? "scale(0.993) translateX(0)" : "translateZ(0)",
        transition: "background 120ms ease, border-color 160ms ease, transform 80ms ease",
        outline: "none",
        position: "relative",
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={handleClick}
      onKeyDown={e => e.key === "Enter" && handleClick()}
    >
      {/* ── Index badge ──────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        width: 26, height: 26,
        borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, letterSpacing: "-0.03em",
        transition: "all 150ms ease",
        background: isSelected
          ? "var(--brand)"
          : isFav
          ? "rgba(212,136,10,0.12)"
          : "rgba(28,25,23,0.05)",
        color: isSelected ? "white" : isFav ? "#854d04" : "var(--ink-3)",
        border: isSelected ? "none" : isFav ? "1px solid rgba(212,136,10,0.18)" : "1px solid rgba(28,25,23,0.08)",
      }}>
        {index + 1}
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Row 1 — name + heart */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <h3 style={{
            flex: 1, margin: 0,
            fontSize: 13.5, fontWeight: 700, lineHeight: 1,
            letterSpacing: "-0.03em",
            color: isSelected ? "#9a2d08" : "var(--ink-1)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color 120ms ease",
          }}>
            {place.name}
          </h3>
          <HeartButton isFavorite={isFav} size={14} onClick={() => onToggleFavorite()} />
        </div>

        {/* Row 2 — meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>

          {/* Cuisine pill */}
          {cuisine && (
            <span style={{
              fontSize: 10.5, fontWeight: 600,
              padding: "2.5px 8px", borderRadius: 999,
              background: isSelected
                ? "rgba(224,90,30,0.1)"
                : isFav
                ? "rgba(212,136,10,0.09)"
                : "rgba(28,25,23,0.05)",
              color: isSelected ? "#9a2d08" : isFav ? "#854d04" : "#78716c",
              border: `1px solid ${isSelected ? "rgba(224,90,30,0.18)" : isFav ? "rgba(212,136,10,0.14)" : "rgba(28,25,23,0.08)"}`,
              maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flexShrink: 0,
              letterSpacing: "0.01em",
              transition: "all 150ms ease",
            }}>
              {cuisine}
            </span>
          )}

          {/* Open/closed */}
          {place.open_now !== undefined && (
            <span style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 10.5, fontWeight: 600, flexShrink: 0,
              color: place.open_now ? "#1b7f4f" : "#c53030",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "block", flexShrink: 0 }}/>
              {place.open_now ? "Open" : "Closed"}
            </span>
          )}

          {/* Rating */}
          {rating != null && (
            <span style={{
              display: "flex", alignItems: "center", gap: 2.5,
              fontSize: 11, fontWeight: 700, color: ratingColor, flexShrink: 0,
            }}>
              <IcoStar />
              {rating.toFixed(1)}
            </span>
          )}

          {/* Price */}
          {price != null && (
            <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, letterSpacing: "0.01em" }}>
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} style={{ color: i < price ? "#d4880a" : "var(--ink-4)" }}>$</span>
              ))}
            </span>
          )}

          {/* Distance — right-aligned */}
          {place.distance != null && (
            <span style={{
              marginLeft: "auto", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 11, fontWeight: 500,
              color: "var(--ink-3)",
              fontVariantNumeric: "tabular-nums",
            }}>
              <IcoWalk />
              {place.distance < 1000
                ? `${Math.round(place.distance)} m`
                : `${(place.distance / 1000).toFixed(1)} km`}
            </span>
          )}
        </div>
      </div>

      {/* ── Selected indicator line (right edge) ─────── */}
      {isSelected && (
        <div style={{
          position: "absolute", right: 0, top: "20%", bottom: "20%",
          width: 3, borderRadius: "3px 0 0 3px",
          background: "var(--brand)", opacity: 0.3,
        }}/>
      )}
    </div>
  );
});

export default PlaceCard;
>>>>>>> f265c4a (FinderMaps)
