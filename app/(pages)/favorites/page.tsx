// ============================================================
// app/(pages)/favorites/page.tsx
// Saved places — rich list, sort, click-to-map, remove confirm
// ============================================================
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FavoriteRow } from "@/types";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import { getSupabaseBrowserClient } from "@/lib/hooks/useAuth";

// Helper to get Authorization header
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const sb = getSupabaseBrowserClient();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) return {};
    return { "Authorization": `Bearer ${session.access_token}` };
  } catch {
    return {};
  }
}

// ── Icons ──────────────────────────────────────────────────
const IcoArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const IcoMap = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IcoHeart = ({ filled }: { filled?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill={filled ? "var(--brand)" : "none"}
    stroke={filled ? "var(--brand)" : "currentColor"}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IcoStar = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoSort = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M7 12h10M11 18h2"/>
  </svg>
);
const IcoUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoExternal = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

// ── Logo (reuse from main) ─────────────────────────────────
function Logo() {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,var(--brand) 0%,#d4880a 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(224,90,30,0.28)" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
          <path d="M11 2a2 2 0 0 0-2 2v5H6a1 1 0 0 0-1 1v1c0 3.31 2.69 6 6 6v4h-2v2h6v-2h-2v-4c3.31 0 6-2.69 6-6v-1a1 1 0 0 0-1-1h-3V4a2 2 0 0 0-2-2h-2z"/>
        </svg>
      </div>
      <span style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.05em", color: "var(--ink-1)" }}>
        fork<span style={{ color: "var(--brand)" }}>map</span>
      </span>
    </Link>
  );
}

// ── Delete confirmation modal ──────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onCancel}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(28,25,23,0.4)", backdropFilter: "blur(4px)" }}/>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative", background: "var(--surface-1)", borderRadius: 20,
          padding: "28px 28px 24px", maxWidth: 360, width: "100%",
          boxShadow: "0 24px 64px rgba(28,25,23,0.2), 0 0 0 1px rgba(28,25,23,0.08)",
          animation: "scaleIn 200ms cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--red-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <IcoTrash />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink-1)" }}>Remove from saved?</h3>
        <p style={{ margin: "0 0 22px", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--ink-2)" }}>{name}</strong> will be removed from your saved places.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid rgba(28,25,23,0.12)", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", fontFamily: "inherit", transition: "background 100ms" }}>
            Keep it
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "var(--red)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "white", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(197,48,48,0.25)", transition: "background 100ms" }}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fav card ───────────────────────────────────────────────
function FavCard({
  fav, index, onRemove, onOpenMap
}: {
  fav: FavoriteRow; index: number;
  onRemove: () => void;
  onOpenMap: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressing, setPressing] = useState(false);

  const cuisine = fav.snapshot?.cuisine ?? fav.snapshot?.fsq?.categories?.[0]?.name;
  const rating  = fav.snapshot?.fsq?.rating;
  const price   = fav.snapshot?.fsq?.price;
  const address = fav.snapshot?.address;

  const savedDate = new Date(fav.created_at);
  const isToday   = new Date().toDateString() === savedDate.toDateString();
  const dateLabel = isToday
    ? "Saved today"
    : `Saved ${savedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  const ratingColor = rating == null ? "var(--ink-3)"
    : rating >= 8 ? "#1b7f4f"
    : rating >= 6 ? "var(--brand)"
    : "#c53030";

  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: `1px solid ${hovered ? "rgba(224,90,30,0.2)" : "rgba(28,25,23,0.07)"}`,
        borderLeft: `4px solid ${hovered ? "var(--brand)" : "rgba(224,90,30,0.35)"}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: hovered
          ? "0 8px 24px rgba(28,25,23,0.1), 0 2px 6px rgba(28,25,23,0.05)"
          : "0 1px 4px rgba(28,25,23,0.05)",
        transform: pressing ? "scale(0.993)" : "translateZ(0)",
        transition: "box-shadow 150ms ease, border-color 150ms ease, transform 80ms ease",
        animation: `cardIn 300ms cubic-bezier(0.16,1,0.3,1) ${index * 40}ms both`,
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressing(false); }}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      onClick={onOpenMap}
    >
      <div style={{ padding: "16px 16px 14px 18px", display: "flex", gap: 14 }}>
        {/* Left: content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: name + rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <h3 style={{
              margin: 0, fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.03em",
              color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flex: 1,
            }}>
              {fav.name}
            </h3>
            {rating != null && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: ratingColor, flexShrink: 0 }}>
                <IcoStar /> {rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Row 2: tags */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {cuisine && (
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 999, background: "rgba(224,90,30,0.08)", color: "var(--brand-text)", border: "1px solid rgba(224,90,30,0.14)" }}>
                {cuisine}
              </span>
            )}
            {price != null && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#854d04", letterSpacing: "0.04em" }}>
                {"$".repeat(price)}
              </span>
            )}
            {fav.snapshot?.open_now !== undefined && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: fav.snapshot.open_now ? "#1b7f4f" : "#c53030" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }}/>
                {fav.snapshot.open_now ? "Open" : "Closed"}
              </span>
            )}
          </div>

          {/* Row 3: address */}
          {address && (
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--ink-3)", display: "flex", alignItems: "flex-start", gap: 5 }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}><IcoMap /></span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{address}</span>
            </p>
          )}

          {/* Row 4: date + open-in-map hint */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 500 }}>{dateLabel}</span>
            {hovered && (
              <span style={{ fontSize: 11, color: "var(--brand)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, animation: "fadeIn 120ms ease both" }}>
                <IcoExternal /> Open on map
              </span>
            )}
          </div>
        </div>

        {/* Right: remove button */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 2 }}>
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            aria-label="Remove from saved"
            style={{
              width: 32, height: 32, borderRadius: 10,
              border: "1.5px solid rgba(28,25,23,0.1)",
              background: "transparent",
              color: "var(--ink-4)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 120ms ease",
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--red-light)"; e.currentTarget.style.borderColor = "rgba(197,48,48,0.25)"; e.currentTarget.style.color = "var(--red)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(28,25,23,0.1)"; e.currentTarget.style.color = "var(--ink-4)"; }}
          >
            <IcoTrash />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
type SortKey = "date_desc" | "date_asc" | "name" | "cuisine";

export default function FavoritesPage() {
  const { isReady, auth } = useAuthGuard();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sortBy,    setSortBy]    = useState<SortKey>("date_desc");
  const [toDelete,  setToDelete]  = useState<FavoriteRow | null>(null);

  const loadFavorites = async () => {
    setLoading(true);
    setFetchError(null);
    const authHeaders = await getAuthHeaders();
    fetch("/api/favorites", { headers: authHeaders })
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then(d => setFavorites(d.data ?? []))
      .catch(e => setFetchError(e.message ?? "Failed to load saved places"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isReady) loadFavorites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // ALL hooks must be called before any conditional return
  const sorted = useMemo(() => {
    const arr = [...favorites];
    switch (sortBy) {
      case "date_desc": return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "date_asc":  return arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "name":      return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "cuisine":   return arr.sort((a, b) => (a.snapshot?.cuisine ?? "").localeCompare(b.snapshot?.cuisine ?? ""));
      default:          return arr;
    }
  }, [favorites, sortBy]);

  // While auth is loading or redirecting — AFTER all hooks
  if (!isReady) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--surface-0)", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, border: "3px solid var(--surface-4)", borderTop: "3px solid var(--brand)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
          <span style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600 }}>Loading…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleRemoveConfirm = async () => {
    if (!toDelete) return;
    const authHeaders = await getAuthHeaders();
    await fetch(`/api/favorites/${encodeURIComponent(toDelete.osm_id)}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    setFavorites(prev => prev.filter(f => f.osm_id !== toDelete.osm_id));
    setToDelete(null);
  };

  const handleOpenMap = (fav: FavoriteRow) => {
    // Navigate to main page with the place pre-selected via query params
    router.push(`/?select=${encodeURIComponent(fav.osm_id)}&lat=${fav.lat}&lon=${fav.lon}`);
  };

  const displayName = auth.user?.user_metadata?.full_name ?? auth.user?.email?.split("@")[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)", color: "var(--ink-1)", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{
        height: 56, display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
        background: "rgba(250,249,247,0.97)", backdropFilter: "blur(20px) saturate(1.4)",
        borderBottom: "1px solid rgba(28,25,23,0.07)", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 0 rgba(28,25,23,0.04)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none", color: "var(--ink-3)", fontSize: 12, fontWeight: 600, padding: "5px 8px 5px 4px", borderRadius: 8, transition: "all 100ms" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--ink-1)"; e.currentTarget.style.background = "rgba(28,25,23,0.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}>
          <IcoArrowLeft /> Map
        </Link>

        <div style={{ width: 1, height: 16, background: "rgba(28,25,23,0.12)" }}/>

        <Logo />

        <div style={{ flex: 1 }}/>

        {/* Nav: current page */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 999, background: "rgba(224,90,30,0.08)", border: "1px solid rgba(224,90,30,0.16)" }}>
          <IcoHeart filled />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-text)" }}>Saved places</span>
          {favorites.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 999, background: "var(--brand)", color: "white", marginLeft: 2 }}>
              {favorites.length}
            </span>
          )}
        </div>

        {/* Profile link */}
        <Link href="/account" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, border: "1.5px solid rgba(28,25,23,0.1)", background: "transparent", textDecoration: "none", fontSize: 11, fontWeight: 600, color: "var(--ink-2)", transition: "all 120ms" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(28,25,23,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          {auth.user?.user_metadata?.avatar_url
            ? <img src={auth.user.user_metadata.avatar_url} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} alt="avatar"/>
            : <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,var(--brand),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: "white" }}>
                  {(displayName ?? "U")[0].toUpperCase()}
                </span>
              </div>
          }
          {displayName && <span>{displayName.split(" ")[0]}</span>}
          <IcoUser />
        </Link>
      </header>

      {/* ── PAGE CONTENT ── */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.05em", color: "var(--ink-1)" }}>
              Saved places
            </h1>
            <span style={{ fontSize: 24 }}>🍷</span>
          </div>
          <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 13, fontWeight: 500 }}>
            {loading ? "Loading…" : `${favorites.length} restaurant${favorites.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>

        {/* Sort bar */}
        {!loading && favorites.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              <IcoSort /> Sort
            </span>
            {([ ["date_desc", "Recent first"], ["date_asc", "Oldest first"], ["name", "A → Z"], ["cuisine", "Cuisine"] ] as [SortKey, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setSortBy(key)} style={{
                padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: sortBy === key ? "1.5px solid var(--brand)" : "1.5px solid rgba(28,25,23,0.1)",
                background: sortBy === key ? "rgba(224,90,30,0.08)" : "transparent",
                color: sortBy === key ? "var(--brand-text)" : "var(--ink-3)",
                transition: "all 120ms ease", fontFamily: "inherit",
              }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }}/>
            ))}
          </div>
        )}

        {/* Error state */}
        {fetchError && !loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--red-light)", border: "1px solid rgba(197,48,48,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>Could not load saved places</p>
            <p style={{ margin: "0 0 18px", fontSize: 12, color: "var(--ink-3)" }}>{fetchError}</p>
            <button onClick={loadFavorites} style={{ padding: "8px 18px", borderRadius: 999, border: "1.5px solid rgba(197,48,48,0.3)", background: "var(--red-light)", color: "var(--red)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !favorites.length && (
          <div style={{ textAlign: "center", padding: "64px 0 40px", animation: "fadeUp 300ms var(--ease-out) both" }}>
            <div style={{ width: 72, height: 72, borderRadius: 24, background: "rgba(28,25,23,0.04)", border: "1px solid rgba(28,25,23,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>
              🍽
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink-1)" }}>Nothing saved yet</h2>
            <p style={{ margin: "0 0 24px", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.7 }}>
              Tap the ♡ on any restaurant on the map<br/>to save it here.
            </p>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 24px", borderRadius: 12, background: "var(--brand)", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 16px rgba(224,90,30,0.25)" }}>
              Explore restaurants →
            </Link>
          </div>
        )}

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((fav, i) => (
            <FavCard
              key={fav.id}
              fav={fav}
              index={i}
              onRemove={() => setToDelete(fav)}
              onOpenMap={() => handleOpenMap(fav)}
            />
          ))}
        </div>
      </div>

      {/* Delete modal */}
      {toDelete && (
        <DeleteModal
          name={toDelete.name}
          onConfirm={handleRemoveConfirm}
          onCancel={() => setToDelete(null)}
        />
      )}

      {/* Legal footer */}
      <footer style={{ borderTop: "1px solid rgba(28,25,23,0.07)", padding: "18px 20px", display: "flex", flexWrap: "wrap", gap: "6px 16px", justifyContent: "center", marginTop: 8 }}>
        {[
          { href: "/", label: "← Map" },
          { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" },
          { href: "/attribution", label: "Data attribution" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textDecoration: "none" }}>
            {label}
          </Link>
        ))}
        <span style={{ fontSize: 11, color: "var(--ink-4)" }}>© {new Date().getFullYear()} Forkmap · Data © OpenStreetMap contributors</span>
      </footer>

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        @keyframes cardIn   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        .skeleton {
          background: linear-gradient(90deg, var(--surface-3) 0%, var(--surface-2) 40%, var(--surface-3) 80%);
          background-size: 300% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--surface-4); border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
