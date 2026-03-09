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
