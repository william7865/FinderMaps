"use client";

// ============================================================
// components/map/MapView.tsx — Leaflet map with markers
// ============================================================

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { PlaceCard } from "@/types";

// Fix Leaflet default icon paths (webpack breaks them)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons
function createMarkerIcon(color: string, size = 28): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid rgba(255,255,255,0.9);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const ICONS = {
  default: createMarkerIcon("#f59e0b"),   // amber
  selected: createMarkerIcon("#ef4444", 34), // red, larger
  hovered: createMarkerIcon("#fb923c", 30),  // orange
  favorite: createMarkerIcon("#a855f7"),  // purple
};

// ---------- Types ----------

interface BBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  centerLat: number;
  centerLon: number;
}

interface MapViewProps {
  places: PlaceCard[];
  selectedId?: string;
  hoveredId?: string | null;
  onMoveEnd: (bbox: BBox) => void;
  onMarkerClick: (place: PlaceCard) => void;
  onMarkerHover: (id: string | null) => void;
}

// ---------- Component ----------

export default function MapView({
  places,
  selectedId,
  hoveredId,
  onMoveEnd,
  onMarkerClick,
  onMarkerHover,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  // ---------- Initialize map ----------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [48.8566, 2.3522], // Paris
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Custom zoom control position
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Marker cluster group
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MCG = require("leaflet.markercluster");
    const clusterGroup = MCG.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
    });
    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    mapRef.current = map;

    // Move/zoom event with debounce
    const onMove = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const b = map.getBounds();
        const center = map.getCenter();
        onMoveEnd({
          minLon: b.getWest(),
          minLat: b.getSouth(),
          maxLon: b.getEast(),
          maxLat: b.getNorth(),
          centerLat: center.lat,
          centerLon: center.lng,
        });
      }, 500);
    };

    map.on("moveend", onMove);
    map.on("zoomend", onMove);

    // Initial fetch
    onMove();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      map.off("moveend", onMove);
      map.off("zoomend", onMove);
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Sync markers ----------
  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    const existing = markersRef.current;
    const newIds = new Set(places.map((p) => p.osm_id));

    // Remove stale markers
    for (const [id, marker] of existing) {
      if (!newIds.has(id)) {
        clusterGroup.removeLayer(marker);
        existing.delete(id);
      }
    }

    // Add or update markers
    for (const place of places) {
      if (existing.has(place.osm_id)) continue; // already exists

      const icon =
        place.osm_id === selectedId
          ? ICONS.selected
          : place.is_favorite
          ? ICONS.favorite
          : ICONS.default;

      const marker = L.marker([place.lat, place.lon], { icon })
        .bindTooltip(place.name, { direction: "top", offset: [0, -20] })
        .on("click", () => onMarkerClick(place))
        .on("mouseover", () => onMarkerHover(place.osm_id))
        .on("mouseout", () => onMarkerHover(null));

      clusterGroup.addLayer(marker);
      existing.set(place.osm_id, marker);
    }
  }, [places, selectedId, onMarkerClick, onMarkerHover]);

  // ---------- Update icons for selected/hovered ----------
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const place = places.find((p) => p.osm_id === id);
      if (!place) continue;
      const icon =
        id === selectedId
          ? ICONS.selected
          : id === hoveredId
          ? ICONS.hovered
          : place.is_favorite
          ? ICONS.favorite
          : ICONS.default;
      marker.setIcon(icon);
    }
  }, [selectedId, hoveredId, places]);

  // ---------- Pan to selected ----------
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const place = places.find((p) => p.osm_id === selectedId);
    if (place) {
      mapRef.current.panTo([place.lat, place.lon], { animate: true });
    }
  }, [selectedId, places]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#1c1917" }}
    />
  );
}
