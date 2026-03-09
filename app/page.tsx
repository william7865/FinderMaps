"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { PlaceCard, FilterState } from "@/types";
import { useRestaurants } from "@/lib/hooks/useRestaurants";
import { useRouteCache, type TransportMode } from "@/lib/hooks/useRouteCache";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import FiltersPanel from "@/components/filters/FiltersPanel";
import PlaceList from "@/components/place/PlaceList";
import PlaceDetail from "@/components/place/PlaceDetail";
import StartPanel from "@/components/location/StartPanel";
import ToastStack from "@/components/ui/ToastStack";
import AuthButton from "@/components/ui/AuthButton";
import AuthModal from "@/components/ui/AuthModal";
import BottomSheet from "@/components/ui/BottomSheet";
import MapLoadingOverlay from "@/components/states/MapLoadingOverlay";
import type { MapViewHandle } from "@/components/map/MapView";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div style={{ flex:1, background:"var(--surface-0)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
      <div style={{ width:36,height:36,border:"3px solid var(--surface-4)",borderTop:"3px solid var(--brand)",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>
      <span style={{ fontSize:12,color:"var(--ink-3)",fontWeight:600,letterSpacing:"0.04em" }}>Loading map…</span>
    </div>
  ),
});

// ── Inline SVG icons ───────────────────────────────────────
const IcoSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IcoSliders = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
    <circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="8" cy="18" r="2" fill="currentColor"/>
  </svg>
);
const IcoBookmark = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
);
const IcoMapPin = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcoX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

function EnrichBar({ active }: { active: boolean }) {
  return (
    <div style={{ position:"absolute",bottom:0,left:0,right:0,height:2,background:"transparent",overflow:"hidden",opacity:active?1:0,transition:"opacity 400ms ease" }}>
      <div style={{ position:"absolute",top:0,left:"-50%",width:"50%",height:"100%",background:"linear-gradient(90deg,transparent,var(--brand),transparent)",animation:active?"enrichSweep 1.4s ease-in-out infinite":"none" }}/>
    </div>
  );
}

export default function HomePage() {
  const auth        = useAuth();
  const toast       = useToast();
  const isMobile    = useIsMobile();
  const searchParams = useSearchParams();

  const { filteredPlaces, loading, enriching, error, fetchRestaurants, applyClientFilters, toggleFavorite, favoriteIds } = useRestaurants();

  const [selectedPlace, setSelectedPlace] = useState<PlaceCard|null>(null);
  const [hoveredId,     setHoveredId]     = useState<string|null>(null);
  const [filters,       setFilters]       = useState<FilterState>({ sortBy:"score" });
  const [showFilters,   setShowFilters]   = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── Location
  const [userLocation,  setUserLocation]  = useState<[number,number]|null>(null);
  const [locationLabel, setLocationLabel] = useState<string|null>(null);
  const [locating,      setLocating]      = useState(false);
  const [locateError,   setLocateError]   = useState(false);

  // ── Name search (sidebar)
  const [nameQuery, setNameQuery] = useState("");

  // ── Pin-drop
  const [pinDropActive, setPinDropActive] = useState(false);

  // ── "Search this area"
  const [showSearchHere, setShowSearchHere] = useState(false);
  const [lastSearchBbox, setLastSearchBbox] = useState("");
  const currentBboxRef = useRef("");

  // ── Routing
  const [routeMode,   setRouteMode]   = useState<TransportMode>("foot");
  const [routeResult, setRouteResult] = useState<{duration:number;distance:number;coords:[number,number][];}|null>(null);
  const { getRoute, loading: routeLoading } = useRouteCache();

  const mapRef     = useRef<MapViewHandle>(null);
  const locateDone = useRef(false);

  // ── Filters
  const handleFilters = useCallback((f: FilterState) => { setFilters(f); applyClientFilters(f); }, [applyClientFilters]);
  const activeCount = useMemo(
    () => Object.keys(filters).filter(k => k !== "sortBy" && filters[k as keyof FilterState] != null).length,
    [filters]
  );

  // ── Geolocation
  const locate = useCallback(() => {
    if (!navigator.geolocation) { toast.error("Geolocation is not supported by your browser."); return; }
    setLocating(true); setLocateError(false); setLocationLabel(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number,number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords); setLocating(false);
        mapRef.current?.flyTo(coords[0], coords[1], 15);
        toast.success("Location updated");
      },
      () => { setLocating(false); setLocateError(true); toast.error("Location access denied."); },
      { timeout:8000, enableHighAccuracy:true }
    );
  }, [toast]);

  useEffect(() => { if (!locateDone.current) { locateDone.current = true; locate(); } }, [locate]);

  // Open auth modal if redirected from a protected page with ?auth=required
  useEffect(() => {
    if (searchParams.get("auth") === "required" && !auth.loading && !auth.user) {
      setShowAuthModal(true);
    }
  }, [searchParams, auth.loading, auth.user]);

  // ── Address location
  const handleLocationChange = useCallback((lat: number, lon: number, label: string) => {
    const coords: [number,number] = [lat, lon];
    setUserLocation(coords); setLocationLabel(label); setLocateError(false);
    mapRef.current?.flyTo(lat, lon, 15);
    toast.success(`Starting from "${label}"`);
    if (selectedPlace) {
      getRoute(coords, [selectedPlace.lat, selectedPlace.lon], routeMode).then(r => {
        setRouteResult(r);
        if (r) mapRef.current?.drawRoute(r.coords);
      });
    }
  }, [selectedPlace, routeMode, getRoute, toast]);

  // ── Pin-drop
  const togglePinDrop = useCallback(() => {
    if (pinDropActive) { mapRef.current?.disablePinDrop(); setPinDropActive(false); }
    else               { mapRef.current?.enablePinDrop();  setPinDropActive(true); }
  }, [pinDropActive]);

  const handlePinDrop = useCallback((lat: number, lon: number) => {
    setUserLocation([lat, lon]); setLocationLabel(null); setPinDropActive(false);
    toast.success("Start point set on map");
    if (selectedPlace) {
      getRoute([lat, lon], [selectedPlace.lat, selectedPlace.lon], routeMode).then(r => {
        setRouteResult(r); if (r) mapRef.current?.drawRoute(r.coords);
      });
    }
  }, [selectedPlace, routeMode, getRoute, toast]);

  // ── "Search this area"
  const handleMoveEnd = useCallback((bbox: Parameters<typeof fetchRestaurants>[0]) => {
    const key = `${bbox.minLon.toFixed(3)},${bbox.minLat.toFixed(3)},${bbox.maxLon.toFixed(3)},${bbox.maxLat.toFixed(3)}`;
    currentBboxRef.current = key;
    if (lastSearchBbox && key !== lastSearchBbox) setShowSearchHere(true);
    else { setLastSearchBbox(key); fetchRestaurants(bbox); }
  }, [lastSearchBbox, fetchRestaurants]);

  const doSearchHere = useCallback(() => {
    setShowSearchHere(false); setLastSearchBbox(currentBboxRef.current);
    const bounds = mapRef.current?.getBounds();
    if (bounds) fetchRestaurants(bounds);
  }, [fetchRestaurants]);

  // ── Routing
  const doRoute = useCallback(async (place: PlaceCard, mode: TransportMode) => {
    if (!userLocation) return;
    mapRef.current?.clearRoute();
    const result = await getRoute(userLocation, [place.lat, place.lon], mode);
    setRouteResult(result);
    if (result) mapRef.current?.drawRoute(result.coords);
    else toast.error("Could not calculate route.");
  }, [userLocation, getRoute, toast]);

  const handleMarkerClick = useCallback((place: PlaceCard) => {
    setSelectedPlace(place);
    if (userLocation) doRoute(place, routeMode);
  }, [userLocation, routeMode, doRoute]);

  const handleTransportChange = useCallback((mode: TransportMode) => {
    setRouteMode(mode);
    if (selectedPlace && userLocation) doRoute(selectedPlace, mode);
  }, [selectedPlace, userLocation, doRoute]);

  const handleCloseDetail = useCallback(() => {
    setSelectedPlace(null); setRouteResult(null); mapRef.current?.clearRoute();
  }, []);

  // ── Favorite toggle — read from favoriteIds (source of truth), NOT
  // place.is_favorite which can be a stale snapshot after the first toggle.
  const handleToggleFavorite = useCallback(async (place: PlaceCard) => {
    const isCurrentlyFav = favoriteIds.has(place.osm_id);
    await toggleFavorite(place);
    if (isCurrentlyFav) {
      toast.info(`"${place.name}" removed from favourites`);
    } else {
      toast.success(`"${place.name}" saved to favourites`);
    }
  }, [toggleFavorite, favoriteIds, toast]);

  // ── Name filter
  const visiblePlaces = useMemo(() =>
    nameQuery.trim()
      ? filteredPlaces.filter(p =>
          p.name.toLowerCase().includes(nameQuery.toLowerCase()) ||
          p.cuisine?.toLowerCase().includes(nameQuery.toLowerCase())
        )
      : filteredPlaces,
    [filteredPlaces, nameQuery]
  );

  return (
    <div style={{ position:"fixed",inset:0,display:"flex",flexDirection:"column",background:"var(--surface-0)",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* ════════════════ HEADER ════════════════ */}
      <header style={{
        height:56, flexShrink:0, position:"relative",
        display:"flex", alignItems:"center", padding:"0 16px", gap:10,
        background:"rgba(250,249,247,0.98)",
        backdropFilter:"blur(20px) saturate(1.4)",
        borderBottom:"1px solid rgba(28,25,23,0.07)",
        zIndex:1000,
      }}>

        {/* Logo */}
        <a href="/" style={{ display:"flex",alignItems:"center",gap:7,textDecoration:"none",flexShrink:0,marginRight:4 }}>
          <div style={{ width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,var(--brand) 0%,#d4880a 100%)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 10px rgba(224,90,30,0.28)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
              <path d="M11 2a2 2 0 0 0-2 2v5H6a1 1 0 0 0-1 1v1c0 3.31 2.69 6 6 6v4h-2v2h6v-2h-2v-4c3.31 0 6-2.69 6-6v-1a1 1 0 0 0-1-1h-3V4a2 2 0 0 0-2-2h-2z"/>
            </svg>
          </div>
          <span style={{ fontWeight:800,fontSize:15.5,letterSpacing:"-0.05em",color:"var(--ink-1)" }}>
            fork<span style={{ color:"var(--brand)" }}>map</span>
          </span>
        </a>

        {/* Search bar — wider, more prominent */}
        <div style={{ flex:1,maxWidth:340,position:"relative" }}>
          <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--ink-3)",pointerEvents:"none",display:"flex" }}>
            <IcoSearch />
          </span>
          <input
            type="text"
            placeholder="Search restaurants or cuisines…"
            value={nameQuery}
            onChange={e => setNameQuery(e.target.value)}
            style={{
              width:"100%",
              padding:"8px 30px 8px 30px",
              borderRadius:10,
              border:"1.5px solid rgba(28,25,23,0.1)",
              background:"rgba(28,25,23,0.04)",
              color:"var(--ink-1)",
              fontSize:12.5,
              fontWeight:500,
              outline:"none",
              fontFamily:"inherit",
              transition:"border-color 120ms, background 120ms, box-shadow 120ms",
            }}
            onFocusCapture={e=>{ e.currentTarget.style.borderColor="var(--brand)"; e.currentTarget.style.background="white"; e.currentTarget.style.boxShadow="0 0 0 3px rgba(224,90,30,0.12)"; }}
            onBlurCapture={e=>{ e.currentTarget.style.borderColor="rgba(28,25,23,0.1)"; e.currentTarget.style.background="rgba(28,25,23,0.04)"; e.currentTarget.style.boxShadow="none"; }}
          />
          {nameQuery && (
            <button onClick={()=>setNameQuery("")} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--ink-3)",display:"flex",padding:2 }}>
              <IcoX />
            </button>
          )}
        </div>

        <div style={{ flex:1 }}/>

        {/* Loading spinner */}
        {loading && (
          <div style={{ display:"flex",alignItems:"center",gap:5,flexShrink:0 }}>
            <div style={{ width:13,height:13,border:"2px solid rgba(28,25,23,0.1)",borderTop:"2px solid var(--brand)",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>
            <span style={{ fontSize:11,fontWeight:600,color:"var(--ink-3)" }}>Loading…</span>
          </div>
        )}

        {/* Count pill */}
        {!loading && filteredPlaces.length > 0 && (
          <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,background:"rgba(28,25,23,0.05)",border:"1px solid rgba(28,25,23,0.08)",color:"var(--ink-3)",flexShrink:0 }}>
            {filteredPlaces.length}
          </span>
        )}

        {/* Separator */}
        <div style={{ width:1,height:20,background:"rgba(28,25,23,0.1)",flexShrink:0 }}/>

        {/* Pin start */}
        <button onClick={togglePinDrop} title="Pick a start point on the map" style={{
          display:"flex",alignItems:"center",gap:5,
          padding:"7px 11px",borderRadius:9,cursor:"pointer",
          fontSize:11,fontWeight:700,
          background:pinDropActive?"rgba(22,163,74,0.1)":"transparent",
          border:`1.5px solid ${pinDropActive?"rgba(22,163,74,0.35)":"rgba(28,25,23,0.1)"}`,
          color:pinDropActive?"#166534":"var(--ink-2)",
          boxShadow:pinDropActive?"0 0 0 3px rgba(22,163,74,0.12)":"none",
          transition:"all 150ms ease",flexShrink:0,
        }}>
          <IcoMapPin />
          {pinDropActive ? "Click map…" : "Pin start"}
        </button>

        {/* Filters */}
        <button onClick={()=>setShowFilters(v=>!v)} style={{
          display:"flex",alignItems:"center",gap:5,
          padding:"7px 12px",borderRadius:9,cursor:"pointer",
          fontSize:11,fontWeight:700,
          background:showFilters?"var(--brand)":"transparent",
          border:`1.5px solid ${showFilters?"var(--brand)":"rgba(28,25,23,0.1)"}`,
          color:showFilters?"white":"var(--ink-2)",
          boxShadow:showFilters?"0 4px 14px rgba(224,90,30,0.2)":"none",
          transition:"all 150ms ease",flexShrink:0,
        }}>
          <IcoSliders />
          Filters
          {activeCount>0 && (
            <span style={{ width:16,height:16,borderRadius:"50%",background:"rgba(255,255,255,0.3)",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center" }}>
              {activeCount}
            </span>
          )}
        </button>

        {/* Saved */}
        <a href="/favorites" style={{
          display:"flex",alignItems:"center",gap:5,
          padding:"7px 12px",borderRadius:9,
          textDecoration:"none",fontSize:11,fontWeight:700,
          background:"transparent",border:"1.5px solid rgba(28,25,23,0.1)",
          color:"var(--accent)",flexShrink:0,
          transition:"all 120ms ease",
        }}
          onMouseEnter={e=>(e.currentTarget.style.background="rgba(212,136,10,0.06)")}
          onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
        >
          <IcoBookmark />
          Saved
        </a>

        {/* Auth */}
        <AuthButton auth={auth} onOpenModal={() => setShowAuthModal(true)} />

        <EnrichBar active={enriching} />
      </header>

      {/* Pin-drop banner */}
      {pinDropActive && (
        <div style={{
          position:"absolute",top:56,left:0,right:0,zIndex:999,
          background:"#166534",color:"white",
          fontSize:11,fontWeight:700,textAlign:"center",
          padding:"8px 16px",letterSpacing:"0.02em",
          animation:"fadeDown 180ms var(--ease-out) both",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,
        }}>
          <IcoMapPin />
          Click anywhere on the map to set your starting point
          <button onClick={togglePinDrop} style={{ background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.3)",color:"white",cursor:"pointer",fontWeight:700,padding:"2px 9px",borderRadius:6,fontSize:10,marginLeft:4,fontFamily:"inherit" }}>
            Cancel
          </button>
        </div>
      )}

      {/* ════════════════ BODY ════════════════ */}
      <div style={{ flex:1,display:"flex",overflow:"hidden",position:"relative",marginTop:pinDropActive?34:0,transition:"margin-top 200ms var(--ease-out)" }}>

        {/* ════ SIDEBAR — hidden on mobile (bottom sheet used instead) ════ */}
        <div style={{
          width:296, flexShrink:0,
          display: isMobile ? "none" : "flex", flexDirection:"column",
          borderRight:"1px solid rgba(28,25,23,0.07)",
          background:"var(--surface-1)",
          overflow:"hidden",
        }}>

          {/* Start panel */}
          <StartPanel
            userLocation={userLocation}
            locationLabel={locationLabel}
            onLocationChange={handleLocationChange}
            onLocateMe={locate}
            locating={locating}
            locateError={locateError}
          />

          {/* Filters (collapsible) */}
          <div style={{ maxHeight:showFilters?580:0,overflow:"hidden",transition:"max-height 380ms var(--ease-out)",flexShrink:0 }}>
            <div style={{ borderBottom:"1px solid rgba(28,25,23,0.07)" }}>
              <FiltersPanel filters={filters} onChange={handleFilters}/>
            </div>
          </div>

          {/* Status bar */}
          <div style={{
            padding:"7px 16px",
            background:"rgba(28,25,23,0.02)",
            borderBottom:"1px solid rgba(28,25,23,0.06)",
            display:"flex",justifyContent:"space-between",alignItems:"center",
            flexShrink:0, minHeight:32,
          }}>
            <span style={{ fontSize:10,fontWeight:700,color:"var(--ink-3)",letterSpacing:"0.07em",textTransform:"uppercase" }}>
              {loading
                ? <span style={{ color:"var(--brand)",letterSpacing:"0.04em" }}>Searching…</span>
                : nameQuery
                ? `${visiblePlaces.length} result${visiblePlaces.length!==1?"s":""}`
                : `${filteredPlaces.length} place${filteredPlaces.length!==1?"s":""}`}
            </span>
            {enriching && !loading && (
              <span style={{ fontSize:10,color:"var(--brand)",fontWeight:700,display:"flex",alignItems:"center",gap:4 }}>
                <span style={{ width:7,height:7,border:"1.5px solid var(--brand)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block" }}/>
                Enriching
              </span>
            )}
            {error && !enriching && (
              <span style={{ fontSize:10,color:"var(--red)",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }} title={error}>{error}</span>
            )}
          </div>

          {/* Skeleton loaders */}
          {loading && filteredPlaces.length===0 && (
            <div>
              {[1,2,3,4,5,6].map(i=>(
                <div key={i} style={{ padding:"0 16px 0 13px",borderBottom:"1px solid rgba(28,25,23,0.05)",display:"flex",gap:11,alignItems:"center",height:88,boxSizing:"border-box" }}>
                  <div className="skeleton" style={{ width:26,height:26,borderRadius:8,flexShrink:0 }}/>
                  <div style={{ flex:1,display:"flex",flexDirection:"column",gap:8 }}>
                    <div className="skeleton" style={{ height:12,width:"65%",borderRadius:5 }}/>
                    <div className="skeleton" style={{ height:9,width:"40%",borderRadius:5 }}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Restaurant list */}
          <div style={{ flex:1,overflow:"hidden" }}>
            <PlaceList
              places={visiblePlaces}
              selectedId={selectedPlace?.osm_id}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={handleMarkerClick}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        </div>

        {/* ════ MAP ════ */}
        <div style={{ flex:1,position:"relative",overflow:"hidden" }}>
          <MapView
            ref={mapRef}
            places={filteredPlaces}
            selectedId={selectedPlace?.osm_id}
            hoveredId={hoveredId}
            userLocation={userLocation}
            onMoveEnd={handleMoveEnd}
            onMarkerClick={handleMarkerClick}
            onMarkerHover={setHoveredId}
            onPinDrop={handlePinDrop}
            showSearchHere={showSearchHere}
            onSearchHere={doSearchHere}
          />
          <MapLoadingOverlay
            loading={loading}
            enriching={enriching}
            routeLoading={routeLoading}
          />
        </div>
      </div>

      {/* ════════════════ MOBILE BOTTOM SHEET ════════════════ */}
      {isMobile && (
        <BottomSheet
          title="Restaurants"
          subtitle={loading ? "Loading…" : `${visiblePlaces.length} found`}
          defaultSnap="half"
        >
          <StartPanel
            userLocation={userLocation}
            locationLabel={locationLabel}
            onLocationChange={handleLocationChange}
            onLocateMe={locate}
            locating={locating}
            locateError={locateError}
          />
          <PlaceList
            places={visiblePlaces}
            selectedId={selectedPlace?.osm_id}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={handleMarkerClick}
            onToggleFavorite={handleToggleFavorite}
            loading={loading}
            error={error}
            nameQuery={nameQuery}
            hasActiveFilters={activeCount > 0}
            onRetry={() => mapRef.current?.getBounds() && fetchRestaurants(mapRef.current.getBounds()!)}
          />
        </BottomSheet>
      )}

      {/* Detail drawer */}
      {selectedPlace && (
        <PlaceDetail
          place={selectedPlace}
          onClose={handleCloseDetail}
          onToggleFavorite={handleToggleFavorite}
          routeResult={routeResult}
          routeLoading={routeLoading}
          routeMode={routeMode}
          hasUserLocation={!!userLocation}
          onTransportChange={handleTransportChange}
        />
      )}

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          auth={auth}
          onClose={() => setShowAuthModal(false)}
          onSuccess={msg => toast.success(msg)}
          onError={msg => toast.error(msg)}
        />
      )}

      {/* Toast notifications */}
      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes enrichSweep { 0%{left:-50%} 100%{left:100%} }
        .anim-slide-right { animation: slideInRight 300ms cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes slideInRight { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}
