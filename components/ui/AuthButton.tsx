// ============================================================
// components/ui/AuthButton.tsx
// Header auth button — avatar + portal dropdown.
//
// WHY A PORTAL?
// The header uses backdropFilter which creates a CSS stacking
// context. Any child z-index is relative to that context, so
// the dropdown always renders behind the Leaflet map no matter
// what z-index value is used. createPortal() appends the
// dropdown directly to document.body, escaping entirely.
// ============================================================
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { AuthState } from "@/lib/hooks/useAuth";

interface Props {
  auth: AuthState;
  onOpenModal: () => void;
}

const IcoUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoLogOut = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoHeart = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcoChevron = ({ open }: { open: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 180ms ease" }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Portal panel — rendered in document.body ───────────────
interface PanelProps {
  anchorRef: React.RefObject<HTMLElement>;
  auth: AuthState;
  onClose: () => void;
}

function DropdownPanel({ anchorRef, auth, onClose }: PanelProps) {
  const [rect, setRect] = useState<{ top: number; right: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Measure anchor position after paint
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom + 6, right: window.innerWidth - r.right });
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !anchorRef.current?.contains(t)) onClose();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [anchorRef, onClose]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!rect) return null;

  const name     = auth.user?.user_metadata?.full_name ?? auth.user?.email?.split("@")[0] ?? "User";
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatar   = auth.user?.user_metadata?.avatar_url;

  return createPortal(
    <div ref={panelRef} style={{
      position: "fixed",
      top: rect.top,
      right: rect.right,
      zIndex: 99999,
      background: "var(--surface-1)",
      border: "1px solid var(--b2)",
      borderRadius: "var(--r-lg)",
      boxShadow: "0 12px 40px rgba(28,25,23,0.16), 0 2px 8px rgba(28,25,23,0.08), 0 0 0 1px var(--b1)",
      minWidth: 210,
      overflow: "hidden",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      animation: "fadeDown 180ms cubic-bezier(0.16,1,0.3,1) both",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--b1)", background: "var(--surface-0)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,var(--brand),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {avatar
            ? <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
            : <span style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{initials}</span>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
          <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{auth.user?.email}</p>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: "5px 0" }}>
        <a href="/favorites" onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", textDecoration: "none", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", transition: "background 80ms" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ color: "var(--accent)", display: "flex" }}><IcoHeart /></span>
          My saved restaurants
        </a>

        <div style={{ height: 1, background: "var(--b1)", margin: "3px 8px" }}/>

        <button
          onClick={() => { auth.signOut(); onClose(); }}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", width: "100%", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--red)", textAlign: "left", transition: "background 80ms" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--red-light)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <IcoLogOut />
          Sign out
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── Main export ────────────────────────────────────────────
export default function AuthButton({ auth, onOpenModal }: Props) {
  const [open,    setOpen]    = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => setMounted(true), []);

  if (auth.loading) {
    return (
      <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--b1)", animation: "shimmer 1.6s ease-in-out infinite" }}/>
    );
  }

  if (!auth.user) {
    return (
      <button onClick={onOpenModal} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: "var(--r-md)", cursor: "pointer", fontSize: 11, fontWeight: 700, background: "var(--surface-1)", border: "1.5px solid var(--b2)", color: "var(--ink-2)", boxShadow: "var(--s1)", transition: "all var(--t2) ease", flexShrink: 0 }}>
        <IcoUser />
        Sign in
      </button>
    );
  }

  const displayName = auth.user.user_metadata?.full_name ?? auth.user.email?.split("@")[0] ?? "User";
  const initials    = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl   = auth.user.user_metadata?.avatar_url;

  return (
    <div ref={triggerRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "4px 10px 4px 4px", borderRadius: "var(--r-pill)",
          cursor: "pointer",
          background: open ? "var(--surface-2)" : "var(--surface-1)",
          border: `1.5px solid ${open ? "var(--b3)" : "var(--b2)"}`,
          boxShadow: "var(--s1)", transition: "all 120ms ease",
        }}
      >
        <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,var(--brand),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
            : <span style={{ fontSize: 10, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{initials}</span>
          }
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-1)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
        <IcoChevron open={open} />
      </button>

      {/* Portal dropdown — appended to document.body, z-index 99999, no stacking context issues */}
      {open && mounted && (
        <DropdownPanel anchorRef={triggerRef} auth={auth} onClose={close} />
      )}
    </div>
  );
}
