"use client";
import { useEffect, useState } from "react";
import HeartButton from "@/components/ui/HeartButton";
import type { PlaceCard } from "@/types";

type TransportMode = "foot" | "bike" | "car";
interface RouteResult { duration:number; distance:number; coords:[number,number][]; }

interface Props {
  place: PlaceCard;
  onClose: () => void;
  onToggleFavorite: (p: PlaceCard) => void;
  routeResult?: RouteResult | null;
  routeLoading?: boolean;
  routeMode?: TransportMode;
  hasUserLocation?: boolean;
  onTransportChange?: (mode: TransportMode) => void;
}

// ── SVG Icons ─────────────────────────────────────────────
const IcoWalk = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1.5"/><path d="M9.8 8.9 7 11l2 5M14 8l2 4-2 2M9 20l2-7"/></svg>;
const IcoBike = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-3l-1.5 9M15 6l3 5.5M8.5 14h8"/></svg>;
const IcoCar  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M14 17H10M5 9l2-4h10l2 4"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>;
const IcoX    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IcoMap  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcoPhone = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.36 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IcoGlobe = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IcoClock = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoArrow = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const IcoRoute = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>;
const IcoStar = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

const MODES: { id:TransportMode; icon:React.ReactNode; label:string; gmaps:string }[] = [
  { id:"foot",  icon:<IcoWalk />, label:"Walk",  gmaps:"walking"   },
  { id:"bike",  icon:<IcoBike />, label:"Bike",  gmaps:"bicycling" },
  { id:"car",   icon:<IcoCar />,  label:"Drive", gmaps:"driving"   },
];

function fmt(secs:number) {
  const m = Math.round(secs/60);
  if (m < 1) return "< 1 min";
  if (m < 60) return `${m} min`;
  return `${Math.floor(m/60)}h ${m%60 ? `${m%60}m` : ""}`.trim();
}
function fmtDist(m:number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`;
}

// Animated rating bar
function RatingBar({ rating }:{ rating:number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW((rating/10)*100), 80); return () => clearTimeout(t); }, [rating]);
  const color = rating>=8?"#1b7f4f":rating>=6?"var(--brand)":"#c53030";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:5, borderRadius:3, background:"rgba(28,25,23,0.07)", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:3, transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)" }}/>
      </div>
      <span style={{ fontSize:16, fontWeight:800, color, fontVariantNumeric:"tabular-nums", minWidth:34, textAlign:"right", letterSpacing:"-0.03em" }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function Label({ children }:{ children:React.ReactNode }) {
  return (
    <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-3)", marginBottom:8 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:"rgba(28,25,23,0.06)", margin:"0 -16px" }}/>;
}

export default function PlaceDetail({
  place, onClose, onToggleFavorite,
  routeResult, routeLoading, routeMode="foot",
  hasUserLocation, onTransportChange
}: Props) {
  const cuisine = place.cuisine ?? place.fsq?.categories?.[0]?.name;
  const currentMode = MODES.find(m => m.id === routeMode) ?? MODES[0];

  return (
    <div
      className="anim-slide-right"
      style={{
        position:"fixed", bottom:16, right:16,
        width:340, maxHeight:"calc(100vh - 86px)",
        background:"var(--surface-1)",
        borderRadius:20,
        boxShadow:"0 24px 64px rgba(28,25,23,0.14), 0 8px 20px rgba(28,25,23,0.07), 0 0 0 1px rgba(28,25,23,0.08)",
        display:"flex", flexDirection:"column", overflow:"hidden",
        zIndex:600,
      }}
    >
      {/* ── Gradient accent top bar ── */}
      <div style={{ height:3, background:"linear-gradient(90deg,var(--brand) 0%,#d4880a 100%)", flexShrink:0 }}/>

      {/* ── HEADER ─────────────────────────────────── */}
      <div style={{ padding:"16px 16px 14px", flexShrink:0 }}>

        {/* Top row: name + actions */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.15, color:"var(--ink-1)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {place.name}
            </h2>
            {cuisine && (
              <span style={{ fontSize:10.5, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--brand)" }}>
                {cuisine}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            {/* Favourite */}
            <div style={{
              width:34, height:34, borderRadius:10,
              border:`1.5px solid ${place.is_favorite ? "rgba(212,136,10,0.3)" : "rgba(28,25,23,0.1)"}`,
              background: place.is_favorite ? "rgba(212,136,10,0.08)" : "rgba(28,25,23,0.03)",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 200ms ease",
            }}>
              <HeartButton isFavorite={!!place.is_favorite} size={16} onClick={() => onToggleFavorite(place)} />
            </div>
            {/* Close */}
            <button onClick={onClose} aria-label="Close" style={{ width:34,height:34,borderRadius:10,border:"1.5px solid rgba(28,25,23,0.1)",background:"rgba(28,25,23,0.03)",color:"var(--ink-3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 150ms ease" }}>
              <IcoX />
            </button>
          </div>
        </div>

        {/* Status row */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {place.open_now !== undefined && (
            <span style={{
              display:"flex", alignItems:"center", gap:5,
              fontSize:11, fontWeight:700,
              padding:"4px 10px", borderRadius:999,
              background: place.open_now ? "rgba(27,127,79,0.08)" : "rgba(197,48,48,0.08)",
              color: place.open_now ? "#1b7f4f" : "#c53030",
              border: `1px solid ${place.open_now ? "rgba(27,127,79,0.18)" : "rgba(197,48,48,0.18)"}`,
            }}>
              <span style={{ width:5,height:5,borderRadius:"50%",background:"currentColor" }}/>
              {place.open_now ? "Open now" : "Closed"}
            </span>
          )}
          {place.fsq?.price != null && (
            <span style={{ fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:999,background:"rgba(212,136,10,0.08)",color:"#854d04",border:"1px solid rgba(212,136,10,0.16)",letterSpacing:"0.05em" }}>
              {"$".repeat(place.fsq.price)}
            </span>
          )}
          {place.distance != null && (
            <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:999,background:"rgba(28,25,23,0.04)",color:"var(--ink-2)",border:"1px solid rgba(28,25,23,0.08)" }}>
              <IcoMap />
              {fmtDist(place.distance)}
            </span>
          )}
        </div>
      </div>

      <Divider />

      {/* ── SCROLLABLE BODY ─────────────────────────── */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 20px", display:"flex", flexDirection:"column", gap:18 }}>

        {/* Rating */}
        {place.fsq?.rating != null && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <Label>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <IcoStar /> Rating
                </span>
              </Label>
              {place.fsq.total_ratings && (
                <span style={{ fontSize:11, color:"var(--ink-3)", fontVariantNumeric:"tabular-nums" }}>
                  {place.fsq.total_ratings.toLocaleString()} reviews
                </span>
              )}
            </div>
            <RatingBar rating={place.fsq.rating} />
          </div>
        )}

        {/* Route section */}
        <div>
          <Label>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}>
              <IcoRoute />
              {hasUserLocation ? "Route from your start" : "Getting there"}
            </span>
          </Label>

          {!hasUserLocation ? (
            <div style={{ padding:"14px",borderRadius:12,background:"rgba(28,25,23,0.03)",border:"1px solid rgba(28,25,23,0.07)",fontSize:12,color:"var(--ink-3)",textAlign:"center",lineHeight:1.6 }}>
              Set a starting point to<br/>see real-time routes
            </div>
          ) : (
            <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid rgba(28,25,23,0.08)", background:"rgba(28,25,23,0.02)" }}>

              {/* Transport mode tabs */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", background:"rgba(28,25,23,0.03)" }}>
                {MODES.map(m => (
                  <button key={m.id} onClick={() => onTransportChange?.(m.id)} style={{
                    padding:"11px 4px 9px",
                    border:"none", cursor:"pointer",
                    background: routeMode===m.id ? "var(--surface-1)" : "transparent",
                    borderBottom: `2px solid ${routeMode===m.id ? "var(--brand)" : "transparent"}`,
                    display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                    color: routeMode===m.id ? "var(--brand)" : "var(--ink-3)",
                    transition:"all 120ms ease",
                    fontFamily:"inherit",
                  }}>
                    {m.icon}
                    <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase" }}>{m.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ padding:"14px 14px 12px" }}>
                {routeLoading ? (
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 0" }}>
                    <div style={{ width:14,height:14,border:"2px solid rgba(28,25,23,0.1)",borderTop:"2px solid var(--brand)",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>
                    <span style={{ fontSize:12,color:"var(--ink-3)" }}>Calculating…</span>
                  </div>
                ) : routeResult ? (
                  <>
                    {/* Time + distance row */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-4)",marginBottom:3 }}>Travel time</div>
                        <div style={{ fontSize:28,fontWeight:800,color:"var(--brand)",letterSpacing:"-0.05em",lineHeight:1 }}>{fmt(routeResult.duration)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-4)",marginBottom:3 }}>By road</div>
                        <div style={{ fontSize:16,fontWeight:700,color:"var(--ink-2)",letterSpacing:"-0.02em" }}>{fmtDist(routeResult.distance)}</div>
                      </div>
                    </div>

                    {/* Route on map indicator */}
                    <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--ink-3)",marginBottom:12,padding:"6px 10px",background:"rgba(28,25,23,0.03)",borderRadius:8,border:"1px solid rgba(28,25,23,0.06)" }}>
                      <IcoRoute />
                      Route traced on map
                    </div>

                    {/* Google Maps CTA */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}&travelmode=${currentMode.gmaps}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px 14px",borderRadius:10,background:"var(--brand)",color:"white",textDecoration:"none",fontSize:12.5,fontWeight:700,letterSpacing:"-0.01em",boxShadow:"0 4px 16px rgba(224,90,30,0.25)",transition:"background 120ms ease" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--brand-hover)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "var(--brand)")}
                    >
                      Open in Google Maps <IcoArrow />
                    </a>
                  </>
                ) : (
                  <p style={{ margin:0,padding:"8px 0",textAlign:"center",fontSize:12,color:"var(--ink-3)" }}>
                    Select a restaurant to calculate route
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {place.fsq?.description && (
          <div>
            <Label>About</Label>
            <p style={{ margin:0,fontSize:13,color:"var(--ink-2)",lineHeight:1.7,letterSpacing:"-0.01em" }}>
              {place.fsq.description}
            </p>
          </div>
        )}

        {/* Hours */}
        {place.fsq?.hours?.display && (
          <div>
            <Label><span style={{ display:"flex",alignItems:"center",gap:4 }}><IcoClock />Hours</span></Label>
            <p style={{ margin:0,fontSize:13,color:"var(--ink-2)" }}>{place.fsq.hours.display}</p>
          </div>
        )}

        {/* Address */}
        {place.address && (
          <div style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"11px 13px",borderRadius:12,background:"rgba(28,25,23,0.03)",border:"1px solid rgba(28,25,23,0.07)" }}>
            <span style={{ flexShrink:0,marginTop:1,color:"var(--ink-3)" }}><IcoMap /></span>
            <span style={{ fontSize:13,color:"var(--ink-2)",lineHeight:1.55 }}>{place.address}</span>
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display:"flex",gap:8 }}>
          {(place.fsq?.website ?? place.website) && (
            <a href={place.fsq?.website ?? place.website} target="_blank" rel="noopener noreferrer"
              style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"11px 12px",borderRadius:10,background:"var(--brand)",color:"white",textDecoration:"none",fontSize:12.5,fontWeight:700,boxShadow:"0 4px 16px rgba(224,90,30,0.22)",letterSpacing:"-0.01em" }}
              onMouseEnter={e => (e.currentTarget.style.background="var(--brand-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background="var(--brand)")}
            >
              <IcoGlobe /> Visit website
            </a>
          )}
          {(place.fsq?.tel ?? place.phone) && (
            <a href={`tel:${place.fsq?.tel ?? place.phone}`}
              style={{ display:"flex",alignItems:"center",gap:5,padding:"11px 14px",borderRadius:10,background:"rgba(28,25,23,0.04)",border:"1.5px solid rgba(28,25,23,0.1)",color:"var(--ink-2)",textDecoration:"none",fontSize:12,fontWeight:600,whiteSpace:"nowrap" }}>
              <IcoPhone /> Call
            </a>
          )}
        </div>

        <a href={`https://www.openstreetmap.org/${place.osm_type}/${place.osm_id.split("/")[1]}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display:"block",textAlign:"center",fontSize:10,color:"var(--ink-4)",textDecoration:"none",letterSpacing:"0.02em" }}>
          View on OpenStreetMap
        </a>
      </div>
    </div>
  );
}
