"use client";
<<<<<<< HEAD

// app/(pages)/favorites/page.tsx — Favorites list page

=======
>>>>>>> f265c4a (FinderMaps)
import { useEffect, useState } from "react";
import type { FavoriteRow } from "@/types";
import Link from "next/link";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
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
=======
    fetch("/api/favorites").then(r => r.json()).then(d => setFavorites(d.data ?? [])).finally(() => setLoading(false));
  }, []);

  const remove = async (osmId: string) => {
    await fetch(`/api/favorites/${encodeURIComponent(osmId)}`, { method:"DELETE" });
    setFavorites(prev => prev.filter(f => f.osm_id !== osmId));
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--surface-0)", color:"var(--ink-1)", fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* Header */}
      <header style={{
        height:56, display:"flex", alignItems:"center", padding:"0 20px", gap:12,
        background:"rgba(250,249,247,0.95)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid var(--b1)", position:"sticky", top:0, zIndex:10,
        boxShadow:"0 1px 0 var(--b1)",
      }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:5, textDecoration:"none", color:"var(--ink-3)", fontSize:12, fontWeight:600 }}>
          ← Map
        </Link>
        <div style={{ width:1, height:16, background:"var(--b2)" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,var(--brand),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🍴</div>
          <span style={{ fontWeight:800, fontSize:15, letterSpacing:"-0.04em", color:"var(--ink-1)" }}>
            fork<span style={{ color:"var(--brand)" }}>map</span>
          </span>
        </div>
        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:"var(--r-pill)", background:"var(--surface-2)", color:"var(--ink-3)", border:"1px solid var(--b1)" }}>
          Saved places
        </span>
      </header>

      <div style={{ maxWidth:560, margin:"0 auto", padding:"28px 20px 40px" }}>
        <h1 style={{ fontWeight:800, fontSize:26, letterSpacing:"-0.04em", margin:"0 0 4px", color:"var(--ink-1)" }}>
          Saved places <span style={{ color:"var(--brand)" }}>♥</span>
        </h1>
        <p style={{ margin:"0 0 22px", color:"var(--ink-3)", fontSize:13, fontWeight:500 }}>
          {favorites.length} restaurant{favorites.length !== 1 ? "s" : ""} saved
        </p>

        {loading && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:72, borderRadius:"var(--r-lg)" }}/>)}
          </div>
        )}

        {!loading && !favorites.length && (
          <div style={{ textAlign:"center", padding:"60px 0 40px" }}>
            <div style={{ fontSize:40, marginBottom:14, opacity:0.5 }}>🍽</div>
            <p style={{ color:"var(--ink-2)", fontWeight:600, marginBottom:4 }}>Nothing saved yet</p>
            <p style={{ color:"var(--ink-3)", fontSize:13, marginBottom:18 }}>Tap the ♡ on any restaurant to save it.</p>
            <Link href="/" style={{ display:"inline-block", padding:"10px 22px", borderRadius:"var(--r-md)", background:"var(--brand)", color:"white", textDecoration:"none", fontSize:13, fontWeight:700, boxShadow:"var(--s-brand)" }}>
              Explore restaurants →
>>>>>>> f265c4a (FinderMaps)
            </Link>
          </div>
        )}

<<<<<<< HEAD
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
=======
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {favorites.map((fav, i) => (
            <div key={fav.id} style={{
              background:"var(--surface-1)", border:"1px solid var(--b1)",
              borderRadius:"var(--r-lg)", padding:"14px 16px",
              display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12,
              boxShadow:"var(--s1)",
              borderLeft:"3px solid var(--brand)",
              animation:`fadeUp 200ms var(--ease-out) ${i*30}ms both`,
            }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, letterSpacing:"-0.02em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {fav.name}
                  </h3>
                  {fav.snapshot?.fsq?.rating != null && (
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 6px", borderRadius:"var(--r-xs)", background:"var(--green-light)", color:"var(--green)", flexShrink:0 }}>
                      ★ {fav.snapshot.fsq.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:5, alignItems:"center" }}>
                  {fav.snapshot?.cuisine && (
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", padding:"2px 8px", borderRadius:"var(--r-pill)", background:"var(--brand-light)", color:"var(--brand-text)", border:"1px solid rgba(224,90,30,0.12)" }}>
                      {fav.snapshot.cuisine}
                    </span>
                  )}
                </div>
                {fav.snapshot?.address && (
                  <p style={{ margin:0, color:"var(--ink-3)", fontSize:12 }}>📍 {fav.snapshot.address}</p>
                )}
                <p style={{ margin:"4px 0 0", color:"var(--ink-4)", fontSize:11 }}>
                  Saved {new Date(fav.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
                </p>
              </div>
              <button onClick={() => remove(fav.osm_id)} aria-label="Remove" style={{
                width:30, height:30, borderRadius:"var(--r-sm)", border:"1px solid var(--b1)",
                background:"var(--surface-2)", color:"var(--ink-3)", cursor:"pointer",
                fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                transition:"all var(--t1) ease",
              }}>×</button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        .skeleton { background:linear-gradient(90deg,var(--surface-3) 0%,var(--surface-2) 40%,var(--surface-3) 80%);background-size:300% 100%;animation:shimmer 1.6s ease-in-out infinite;border-radius:var(--r-sm); }
      `}</style>
>>>>>>> f265c4a (FinderMaps)
    </div>
  );
}
