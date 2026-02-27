"use client";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import type { PlaceCard } from "@/types";

export interface MapViewHandle {
  flyTo: (lat: number, lon: number, zoom?: number) => void;
  drawRoute: (coords: [number,number][], color?: string) => void;
  clearRoute: () => void;
  enablePinDrop: () => void;
  disablePinDrop: () => void;
  getBounds: () => { minLon:number; minLat:number; maxLon:number; maxLat:number; centerLat:number; centerLon:number } | null;
}

interface BBox { minLon:number; minLat:number; maxLon:number; maxLat:number; centerLat:number; centerLon:number; }
interface Props {
  places: PlaceCard[];
  selectedId?: string;
  hoveredId?: string | null;
  userLocation?: [number,number] | null;
  onMoveEnd: (b: BBox) => void;
  onMarkerClick: (p: PlaceCard) => void;
  onMarkerHover: (id: string | null) => void;
  onPinDrop?: (lat: number, lon: number) => void;
  showSearchHere?: boolean;
  onSearchHere?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type A = any;

function loadAsset(tag:"script"|"link", id:string, attrs:Record<string,string>): Promise<void> {
  return new Promise(res => {
    if (document.getElementById(id)) { res(); return; }
    const el = document.createElement(tag);
    el.id = id;
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
    el.onload = () => res(); el.onerror = () => res();
    document.head.appendChild(el);
  });
}

type MState = "default" | "hover" | "selected" | "favorite";

// ── Modern teardrop marker ─────────────────────────────────
// Crisp, flat-design pin. Selected gets a pulse ring + white border.
function markerHTML(state: MState): string {
  const isSelected = state === "selected";
  const isHover    = state === "hover";
  const isFav      = state === "favorite";

  const size   = isSelected ? 38 : isHover ? 34 : 30;
  const fill   = isSelected ? "#1c1917" : isFav ? "#d4880a" : "#e05a1e";
  const stroke = isSelected ? "#e05a1e" : "rgba(255,255,255,0.6)";
  const sw     = isSelected ? 2 : 1.5;
  const shadow = isSelected
    ? "filter:drop-shadow(0 4px 12px rgba(28,25,23,0.32))"
    : isHover
    ? "filter:drop-shadow(0 3px 8px rgba(28,25,23,0.22))"
    : "filter:drop-shadow(0 2px 5px rgba(28,25,23,0.15))";

  // Dot inside: white normally, brand-colored when selected
  const dotFill   = isSelected ? "#e05a1e" : "#ffffff";
  const dotR      = isSelected ? 5 : 4.5;

  // Pulse ring for selected
  const ring = isSelected
    ? `<div style="position:absolute;inset:-8px;border-radius:50%;border:2.5px solid rgba(224,90,30,0.35);animation:pulse-ring 1.8s ease-out infinite;pointer-events:none"></div>`
    : "";

  return `
    <div style="position:relative;width:${size}px;height:${size+8}px;display:flex;flex-direction:column;align-items:center">
      ${ring}
      <svg width="${size}" height="${size+6}" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="${shadow};display:block">
        <path d="M18 2C10.268 2 4 8.268 4 16c0 4.8 2.4 9.1 6.1 11.9L18 42l7.9-14.1C29.6 25.1 32 20.8 32 16 32 8.268 25.732 2 18 2z"
          fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cx="18" cy="16" r="${dotR}" fill="${dotFill}"/>
        ${isFav ? `<path d="M18 12.5l.9 2.6H22l-2.3 1.7.9 2.6L18 17.7l-2.6 1.7.9-2.6L14 15.1h2.1z" fill="rgba(255,255,255,0.9)"/>` : ""}
      </svg>
    </div>`;
}

// ── User location dot ──────────────────────────────────────
function userDotHTML(): string {
  return `
    <div style="position:relative;width:18px;height:18px">
      <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(29,101,200,0.15);animation:pulse-ring 2.4s ease-out infinite"></div>
      <div style="width:18px;height:18px;border-radius:50%;background:#1d65c8;border:2.5px solid white;box-shadow:0 2px 8px rgba(29,101,200,0.4)"></div>
    </div>`;
}

// ── Departure dot (start of route) ────────────────────────
function startDotHTML(): string {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="width:20px;height:20px;border-radius:50%;background:#16a34a;border:2.5px solid white;box-shadow:0 2px 8px rgba(22,163,74,0.4);display:flex;align-items:center;justify-content:center">
        <div style="width:7px;height:7px;border-radius:50%;background:white"></div>
      </div>
      <div style="background:rgba(22,100,74,0.88);color:white;font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px;white-space:nowrap;letter-spacing:0.03em">Start</div>
    </div>`;
}

const MapView = forwardRef<MapViewHandle, Props>(function MapView(
  { places, selectedId, hoveredId, userLocation, onMoveEnd, onMarkerClick, onMarkerHover,
    onPinDrop, showSearchHere, onSearchHere }, ref
) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<A>(null);
  const markersRef    = useRef<Map<string,A>>(new Map());
  const userMarkerRef = useRef<A>(null);
  const startMarkerRef= useRef<A>(null);
  const routeLayerRef = useRef<A>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout>|null>(null);
  const readyRef      = useRef(false);
  const pinModeRef    = useRef(false);
  const lastBboxRef   = useRef<BBox|null>(null);

  const cbMove  = useRef(onMoveEnd);
  const cbClick = useRef(onMarkerClick);
  const cbHover = useRef(onMarkerHover);
  const cbPin   = useRef(onPinDrop);
  cbMove.current  = onMoveEnd;
  cbClick.current = onMarkerClick;
  cbHover.current = onMarkerHover;
  cbPin.current   = onPinDrop;

  useImperativeHandle(ref, () => ({
    flyTo(lat, lon, zoom=15) {
      mapRef.current?.flyTo([lat, lon], zoom, { animate:true, duration:0.7 });
    },
    drawRoute(coords, color="#e05a1e") {
      const L: A = (window as A).L; const map = mapRef.current;
      if (!L || !map) return;
      if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = L.polyline(coords, {
        color, weight:4.5, opacity:0.82, lineCap:"round", lineJoin:"round",
      }).addTo(map);
      if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
      if (coords.length > 0) {
        startMarkerRef.current = L.marker(coords[0], {
          icon: L.divIcon({ className:"", html:startDotHTML(), iconSize:[20,36], iconAnchor:[10,36] }),
          zIndexOffset:2500,
        }).addTo(map);
      }
    },
    clearRoute() {
      const map = mapRef.current; if (!map) return;
      if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
      if (startMarkerRef.current) { map.removeLayer(startMarkerRef.current); startMarkerRef.current = null; }
    },
    enablePinDrop() {
      pinModeRef.current = true;
      if (mapRef.current) mapRef.current.getContainer().style.cursor = "crosshair";
    },
    disablePinDrop() {
      pinModeRef.current = false;
      if (mapRef.current) mapRef.current.getContainer().style.cursor = "";
    },
    getBounds() { return lastBboxRef.current; },
  }));

  // ── Init ───────────────────────────────────────────────
  useEffect(() => {
    if (readyRef.current) return;
    readyRef.current = true;

    (async () => {
      await loadAsset("link","lf-css",{ rel:"stylesheet", href:"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" });
      await loadAsset("script","lf-js",{ src:"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", crossorigin:"" });

      const L: A = (window as A).L;
      if (!L || !containerRef.current) return;
      if ((containerRef.current as A)._leaflet_id) delete (containerRef.current as A)._leaflet_id;

      const map = L.map(containerRef.current, {
        center:[48.8566,2.3522], zoom:15,
        zoomControl:false, preferCanvas:false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution:'© <a href="https://carto.com">CARTO</a> © <a href="https://openstreetmap.org">OSM</a>',
        subdomains:"abcd", maxZoom:20,
      }).addTo(map);

      L.control.zoom({ position:"bottomright" }).addTo(map);
      mapRef.current = map;

      const fire = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const b = map.getBounds(), c = map.getCenter();
          const bbox = { minLon:b.getWest(),minLat:b.getSouth(),maxLon:b.getEast(),maxLat:b.getNorth(),centerLat:c.lat,centerLon:c.lng };
          lastBboxRef.current = bbox;
          cbMove.current(bbox);
        }, 500);
      };

      map.on("click", (e: A) => {
        if (!pinModeRef.current) return;
        cbPin.current?.(e.latlng.lat, e.latlng.lng);
        pinModeRef.current = false;
        map.getContainer().style.cursor = "";
      });

      map.on("moveend", fire);
      map.on("zoomend", fire);
      setTimeout(() => { map.invalidateSize(); fire(); }, 250);
    })();

    return () => {
      readyRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      mapRef.current?.remove(); mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // ── User location dot ──────────────────────────────────
  useEffect(() => {
    const L: A = (window as A).L; const map = mapRef.current;
    if (!L || !map || !userLocation) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = L.marker(userLocation, {
      icon: L.divIcon({ className:"", html:userDotHTML(), iconSize:[18,18], iconAnchor:[9,9] }),
      zIndexOffset:3000,
    }).addTo(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // ── Sync restaurant markers ────────────────────────────
  useEffect(() => {
    const L: A = (window as A).L; const map = mapRef.current;
    if (!L || !map) return;
    const ex = markersRef.current;
    const ids = new Set(places.map(p => p.osm_id));
    for (const [id, m] of ex) { if (!ids.has(id)) { m.remove(); ex.delete(id); } }

    for (const place of places.filter(p => !ex.has(p.osm_id)).slice(0, 200)) {
      const st: MState = place.is_favorite ? "favorite" : "default";
      const sz = 30;
      const marker = L.marker([place.lat, place.lon], {
        icon: L.divIcon({ className:"", html:markerHTML(st), iconSize:[sz,sz+8], iconAnchor:[sz/2,sz+8] }),
      }).addTo(map)
        .bindTooltip(place.name, {
          direction:"top", offset:[0,-sz-6], opacity:1, className:"",
        })
        .on("click",     () => cbClick.current(place))
        .on("mouseover", () => cbHover.current(place.osm_id))
        .on("mouseout",  () => cbHover.current(null));
      ex.set(place.osm_id, marker);
    }
  }, [places]);

  // ── Update icon states on select / hover ───────────────
  useEffect(() => {
    const L: A = (window as A).L; if (!L) return;
    for (const [id, marker] of markersRef.current) {
      const place = places.find(p => p.osm_id === id); if (!place) continue;
      const st: MState = id===selectedId?"selected":id===hoveredId?"hover":place.is_favorite?"favorite":"default";
      const sz = st==="selected"?38:st==="hover"?34:30;
      marker.setIcon(L.divIcon({ className:"", html:markerHTML(st), iconSize:[sz,sz+8], iconAnchor:[sz/2,sz+8] }));
      marker.setZIndexOffset(st==="selected"?2000:st==="hover"?1000:0);
    }
  }, [selectedId, hoveredId, places]);

  // ── Pan to selected ───────────────────────────────────
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const p = places.find(p => p.osm_id === selectedId);
    if (p) mapRef.current.panTo([p.lat, p.lon], { animate:true, duration:0.3 });
  }, [selectedId, places]);

  return (
    <div style={{ position:"relative", width:"100%", height:"100%" }}>
      <div ref={containerRef} style={{ width:"100%", height:"100%" }}/>

      {/* "Search this area" pill */}
      {showSearchHere && (
        <div style={{ position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:400,animation:"fadeDown 200ms var(--ease-out) both" }}>
          <button onClick={onSearchHere} style={{
            display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
            borderRadius:"var(--r-pill)", background:"var(--surface-1)",
            border:"1.5px solid var(--b2)", boxShadow:"var(--s3)",
            fontSize:12, fontWeight:700, color:"var(--ink-1)", cursor:"pointer",
            transition:"all 120ms ease", whiteSpace:"nowrap",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Search this area
          </button>
        </div>
      )}

      <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"linear-gradient(to right, rgba(250,249,247,0.05) 0%, transparent 36px)" }}/>
    </div>
  );
});

export default MapView;
