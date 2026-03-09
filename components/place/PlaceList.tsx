// PlaceList — virtualized, exports nothing else
"use client";
import { memo } from "react";
import type { PlaceCard } from "@/types";
import PlaceCardItem, { ITEM_HEIGHT } from "./PlaceCard";
import { useVirtualList } from "@/lib/hooks/useVirtualList";

interface Props {
  places: PlaceCard[];
  selectedId?: string;
  hoveredId?: string | null;
  onHover: (id: string | null) => void;
  onSelect: (p: PlaceCard) => void;
  onToggleFavorite: (p: PlaceCard) => void;
}

function EmptyState() {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:"40px 24px",textAlign:"center" }}>
      <div style={{ width:48,height:48,borderRadius:16,background:"rgba(28,25,23,0.04)",border:"1px solid rgba(28,25,23,0.07)",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div>
        <p style={{ margin:"0 0 5px",fontSize:13,fontWeight:700,color:"var(--ink-2)",letterSpacing:"-0.02em" }}>No restaurants here</p>
        <p style={{ margin:0,fontSize:12,color:"var(--ink-3)",lineHeight:1.65 }}>Move the map to<br/>explore a new area</p>
      </div>
    </div>
  );
}

const PlaceList = memo(function PlaceList({ places, selectedId, hoveredId, onHover, onSelect, onToggleFavorite }: Props) {
  const { containerRef, virtualItems, totalHeight } = useVirtualList(places, { itemHeight: ITEM_HEIGHT, overscan: 5 });

  if (!places.length) return <EmptyState />;

  return (
    <div ref={containerRef} style={{ height:"100%", overflowY:"auto", overflowX:"hidden" }}>
      <div style={{ height: totalHeight, position:"relative" }}>
        {virtualItems.map(({ item, index, offsetTop }) => (
          <div key={item.osm_id} style={{ position:"absolute", top:offsetTop, left:0, right:0, height:ITEM_HEIGHT }}>
            <PlaceCardItem
              place={item} index={index}
              isSelected={item.osm_id === selectedId}
              isHovered={item.osm_id === hoveredId}
              onHover={() => onHover(item.osm_id)}
              onLeave={() => onHover(null)}
              onClick={() => onSelect(item)}
              onToggleFavorite={() => onToggleFavorite(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default PlaceList;
