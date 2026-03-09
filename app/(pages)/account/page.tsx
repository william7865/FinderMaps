// ============================================================
// app/(pages)/account/page.tsx
// User profile page — stats, info, actions
// ============================================================
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthGuard } from "@/lib/hooks/useAuthGuard";
import type { FavoriteRow } from "@/types";

// ── Icons ──────────────────────────────────────────────────
const IcoArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const IcoLogOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoHeart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--brand)" stroke="none">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const IcoGoogle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const IcoShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
  </svg>
);
const IcoMap = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

// ── Section wrapper ─────────────────────────────────────────
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface-1)", borderRadius: 16, border: "1px solid rgba(28,25,23,0.07)", overflow: "hidden", boxShadow: "0 1px 4px rgba(28,25,23,0.05)" }}>
      {title && (
        <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid rgba(28,25,23,0.06)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--ink-3)" }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: "1px solid rgba(28,25,23,0.05)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(28,25,23,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--ink-3)" }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: mono ? "monospace" : "inherit" }}>{value}</div>
      </div>
    </div>
  );
}

function StatCard({ value, label, color = "var(--brand)" }: { value: string | number; label: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: "var(--surface-1)", borderRadius: 14, border: "1px solid rgba(28,25,23,0.07)", padding: "16px 18px", boxShadow: "0 1px 4px rgba(28,25,23,0.05)", textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.05em", color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", letterSpacing: "0.03em" }}>{label}</div>
    </div>
  );
}

// ── Delete account modal ────────────────────────────────────
function DeleteAccountModal({ email, onConfirm, onCancel }: { email: string; onConfirm: () => void; onCancel: () => void }) {
  const [input, setInput] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onCancel}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(28,25,23,0.5)", backdropFilter: "blur(4px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", background: "var(--surface-1)", borderRadius: 20, padding: "28px 28px 24px", maxWidth: 380, width: "100%", boxShadow: "0 24px 64px rgba(28,25,23,0.2), 0 0 0 1px rgba(28,25,23,0.08)", animation: "scaleIn 200ms cubic-bezier(0.16,1,0.3,1) both" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--red-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <IcoTrash />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em" }}>Delete your account?</h3>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--ink-3)", lineHeight: 1.65 }}>
          This will permanently delete your account and all saved restaurants. This action cannot be undone.
        </p>
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>
          Type <strong>{email}</strong> to confirm:
        </p>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder={email}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(28,25,23,0.12)", background: "var(--surface-2)", fontSize: 13, fontFamily: "monospace", outline: "none", color: "var(--ink-1)", marginBottom: 18, boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid rgba(28,25,23,0.12)", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onConfirm} disabled={input !== email} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: input === email ? "var(--red)" : "var(--surface-3)", cursor: input === email ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700, color: input === email ? "white" : "var(--ink-4)", fontFamily: "inherit", transition: "all 150ms" }}>
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────
export default function AccountPage() {
  const { isReady, auth } = useAuthGuard();

  if (!isReady) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--surface-0)", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, border: "3px solid var(--surface-4)", borderTop: "3px solid var(--brand)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
          <span style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600 }}>Loading account…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <AccountPageInner auth={auth} />;
}

function AccountPageInner({ auth }: { auth: ReturnType<typeof useAuthGuard>["auth"] }) {
  const router = useRouter();
  const [favorites,      setFavorites]      = useState<FavoriteRow[]>([]);
  const [favLoading,     setFavLoading]     = useState(true);
  const [favError,       setFavError]       = useState<string|null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [signingOut,     setSigningOut]     = useState(false);

  useEffect(() => {
    fetch("/api/favorites")
      .then(r => r.json())
      .then(d => setFavorites(d.data ?? []))
      .finally(() => setFavLoading(false));
  }, []);

  /// Auth guard handled by useAuthGuard in parent

  const handleSignOut = async () => {
    setSigningOut(true);
    await auth.signOut();
    router.replace("/");
  };

  const handleDeleteAccount = async () => {
    // In production: call a delete-account API route
    // For now: sign out and redirect
    setShowDeleteModal(false);
    await auth.signOut();
    router.replace("/");
  };

  if (auth.loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--surface-0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "2.5px solid rgba(28,25,23,0.1)", borderTop: "2.5px solid var(--brand)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
      </div>
    );
  }

  const user = auth.user;
  if (!user) return null;

  const displayName  = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";
  const initials     = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl    = user.user_metadata?.avatar_url;
  const provider     = user.app_metadata?.provider ?? "email";
  const isGoogleUser = provider === "google";
  const joinedDate   = new Date(user.created_at);
  const joinedLabel  = joinedDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  // Recent activity: last 3 favorites
  const recentFavs = [...favorites]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

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
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,var(--brand) 0%,#d4880a 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(224,90,30,0.28)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M11 2a2 2 0 0 0-2 2v5H6a1 1 0 0 0-1 1v1c0 3.31 2.69 6 6 6v4h-2v2h6v-2h-2v-4c3.31 0 6-2.69 6-6v-1a1 1 0 0 0-1-1h-3V4a2 2 0 0 0-2-2h-2z"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.05em", color: "var(--ink-1)" }}>fork<span style={{ color: "var(--brand)" }}>map</span></span>
        </Link>
        <div style={{ flex: 1 }}/>
        <Link href="/favorites" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", textDecoration: "none", padding: "5px 10px", borderRadius: 8, transition: "all 100ms" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--brand)"; e.currentTarget.style.background = "rgba(224,90,30,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}>
          ♡ Saved places
        </Link>
        <button onClick={handleSignOut} disabled={signingOut} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "1.5px solid rgba(28,25,23,0.1)", background: "transparent", cursor: signingOut ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 700, color: "var(--red)", fontFamily: "inherit", transition: "all 120ms" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--red-light)"; e.currentTarget.style.borderColor = "rgba(197,48,48,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(28,25,23,0.1)"; }}>
          <IcoLogOut /> {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </header>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 60px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Profile hero */}
        <div style={{ background: "var(--surface-1)", borderRadius: 20, border: "1px solid rgba(28,25,23,0.07)", padding: "28px 24px 24px", boxShadow: "0 1px 4px rgba(28,25,23,0.05)", animation: "fadeUp 300ms var(--ease-out) both", position: "relative", overflow: "hidden" }}>
          {/* Subtle brand gradient background bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,var(--brand),#d4880a)" }}/>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, overflow: "hidden", background: "linear-gradient(135deg,var(--brand),#d4880a)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid var(--surface-0)", boxShadow: "0 4px 16px rgba(224,90,30,0.2)" }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                  : <span style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "-0.04em" }}>{initials}</span>
                }
              </div>
              {isGoogleUser && (
                <div style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: 8, background: "white", border: "2px solid var(--surface-0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(28,25,23,0.12)" }}>
                  <IcoGoogle />
                </div>
              )}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </h1>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: isGoogleUser ? "#deeeff" : "rgba(28,25,23,0.06)", color: isGoogleUser ? "#1d65c8" : "var(--ink-3)", border: `1px solid ${isGoogleUser ? "rgba(29,101,200,0.2)" : "rgba(28,25,23,0.1)"}` }}>
                  {isGoogleUser ? <IcoGoogle /> : <IcoShield />}
                  {isGoogleUser ? "Google account" : "Email & password"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "rgba(28,25,23,0.04)", color: "var(--ink-3)", border: "1px solid rgba(28,25,23,0.08)" }}>
                  <IcoCalendar />
                  Joined {joinedLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, animation: "fadeUp 300ms var(--ease-out) 60ms both" }}>
          <StatCard value={favLoading ? "…" : favorites.length} label="Saved places" color="var(--brand)" />
          <StatCard value={favLoading ? "…" : recentFavs.length > 0 ? new Date(recentFavs[0]?.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"} label="Last saved" color="#1b7f4f" />
          <StatCard value={favLoading ? "…" : [...new Set(favorites.map(f => f.snapshot?.cuisine).filter(Boolean))].length || "—"} label="Cuisines" color="#1d65c8" />
        </div>

        {/* Account info */}
        <div style={{ animation: "fadeUp 300ms var(--ease-out) 100ms both" }}>
          <Section title="Account information">
            <InfoRow icon={<IcoMail />} label="Email" value={user.email ?? "—"} />
            <InfoRow icon={isGoogleUser ? <IcoGoogle /> : <IcoShield />} label="Sign-in method" value={isGoogleUser ? "Google OAuth" : "Email & password"} />
            <InfoRow icon={<IcoCalendar />} label="Member since" value={joinedLabel} />
            <div style={{ padding: "8px 0" }}/>
          </Section>
        </div>

        {/* Recent activity */}
        {!favLoading && recentFavs.length > 0 && (
          <div style={{ animation: "fadeUp 300ms var(--ease-out) 140ms both" }}>
            <Section title="Recently saved">
              {recentFavs.map((fav, i) => (
                <Link key={fav.id} href={`/favorites`} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 20px",
                  borderBottom: i < recentFavs.length - 1 ? "1px solid rgba(28,25,23,0.05)" : "none",
                  textDecoration: "none", transition: "background 100ms",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,25,23,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(224,90,30,0.07)", border: "1px solid rgba(224,90,30,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IcoMap />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fav.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--ink-3)" }}>
                      {fav.snapshot?.cuisine && <span style={{ marginRight: 6 }}>{fav.snapshot.cuisine}</span>}
                      {new Date(fav.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div style={{ color: "var(--brand)", flexShrink: 0 }}><IcoHeart /></div>
                </Link>
              ))}
              <Link href="/favorites" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px 20px", fontSize: 12, fontWeight: 700, color: "var(--brand)", textDecoration: "none", transition: "background 100ms", borderTop: "1px solid rgba(28,25,23,0.05)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(224,90,30,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                View all saved places →
              </Link>
            </Section>
          </div>
        )}

        {/* Danger zone */}
        <div style={{ animation: "fadeUp 300ms var(--ease-out) 180ms both" }}>
          <Section title="Account actions">
            {/* Sign out */}
            <button onClick={handleSignOut} disabled={signingOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid rgba(28,25,23,0.05)", transition: "background 100ms", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(28,25,23,0.02)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(28,25,23,0.04)", border: "1px solid rgba(28,25,23,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)" }}>
                <IcoLogOut />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 700, color: "var(--ink-1)" }}>{signingOut ? "Signing out…" : "Sign out"}</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--ink-3)" }}>Sign out of your account on this device</p>
              </div>
            </button>

            {/* Delete account */}
            <button onClick={() => setShowDeleteModal(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 100ms", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(197,48,48,0.03)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: "rgba(197,48,48,0.06)", border: "1px solid rgba(197,48,48,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)" }}>
                <IcoTrash />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 700, color: "var(--red)" }}>Delete account</p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--ink-3)" }}>Permanently delete your account and all data</p>
              </div>
            </button>
          </Section>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          email={user.email ?? ""}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Legal footer */}
      <footer style={{ borderTop: "1px solid rgba(28,25,23,0.07)", padding: "18px 20px", display: "flex", flexWrap: "wrap", gap: "6px 16px", justifyContent: "center", marginTop: 8 }}>
        {([
          { href: "/", label: "← Map" },
          { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" },
          { href: "/attribution", label: "Data attribution" },
        ] as {href:string;label:string}[]).map(({ href, label }) => (
          <Link key={href} href={href} style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", textDecoration: "none" }}>
            {label}
          </Link>
        ))}
        <span style={{ fontSize: 11, color: "var(--ink-4)" }}>© {new Date().getFullYear()} Forkmap</span>
      </footer>

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--surface-4); border-radius: 2px; }
      `}</style>
    </div>
  );
}
