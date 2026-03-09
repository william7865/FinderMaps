"use client";

import Link from "next/link";
import { LegalFooter } from "./LegalFooter";
import type { ReactNode } from "react";

// ── Shared header for all non-map pages ───────────────────
export function PageHeader({ current }: { current: string }) {
  return (
    <header style={{
      height: 56, flexShrink: 0,
      display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
      background: "rgba(250,249,247,0.97)",
      backdropFilter: "blur(20px) saturate(1.4)",
      borderBottom: "1px solid rgba(28,25,23,0.07)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: 5,
        textDecoration: "none", color: "var(--ink-3)",
        fontSize: 12, fontWeight: 600,
        padding: "5px 8px 5px 4px", borderRadius: 8,
        transition: "all 100ms",
      }}
        onMouseEnter={e => { e.currentTarget.style.color = "var(--ink-1)"; e.currentTarget.style.background = "rgba(28,25,23,0.05)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Map
      </Link>

      <div style={{ width: 1, height: 16, background: "rgba(28,25,23,0.12)" }}/>

      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, #e05a1e 0%, #d4880a 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(224,90,30,0.25)",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M11 2a2 2 0 0 0-2 2v5H6a1 1 0 0 0-1 1v1c0 3.31 2.69 6 6 6v4h-2v2h6v-2h-2v-4c3.31 0 6-2.69 6-6v-1a1 1 0 0 0-1-1h-3V4a2 2 0 0 0-2-2h-2z"/>
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.05em", color: "var(--ink-1)" }}>
          fork<span style={{ color: "#e05a1e" }}>map</span>
        </span>
      </Link>

      <div style={{ flex: 1 }} />

      {/* Current page pill */}
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: "var(--ink-3)",
        background: "rgba(28,25,23,0.05)",
        padding: "3px 10px", borderRadius: 999,
        border: "1px solid rgba(28,25,23,0.07)",
      }}>
        {current}
      </span>
    </header>
  );
}

// ── Full page wrapper for all info pages ──────────────────
export function InfoPage({
  children,
  headerLabel,
  maxWidth = 720,
}: {
  children: ReactNode;
  headerLabel: string;
  maxWidth?: number;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--surface-0)",
      color: "var(--ink-1)",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <PageHeader current={headerLabel} />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth, margin: "0 auto", padding: "44px 24px 64px" }}>
          {children}
        </div>
      </main>
      <GlobalFooter />
    </div>
  );
}

// ── Global footer (used on all info pages) ────────────────
export function GlobalFooter() {
  const year = new Date().getFullYear();

  const cols = [
    {
      label: "Navigate",
      links: [
        { href: "/", label: "Map" },
        { href: "/favorites", label: "Saved places" },
        { href: "/account", label: "Account" },
        { href: "/settings", label: "Settings" },
      ],
    },
    {
      label: "Learn",
      links: [
        { href: "/about", label: "About Forkmap" },
        { href: "/help", label: "Help & FAQ" },
        { href: "/contact", label: "Contact" },
      ],
    },
    {
      label: "Legal",
      links: [
        { href: "/privacy", label: "Privacy policy" },
        { href: "/terms", label: "Terms of service" },
        { href: "/attribution", label: "Data attribution" },
      ],
    },
  ];

  return (
    <footer style={{
      background: "var(--surface-1)",
      borderTop: "1px solid rgba(28,25,23,0.07)",
      padding: "40px 24px 28px",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Top: logo + columns */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr repeat(3, auto)",
          gap: 40,
          marginBottom: 36,
          flexWrap: "wrap",
        }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#e05a1e,#d4880a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M11 2a2 2 0 0 0-2 2v5H6a1 1 0 0 0-1 1v1c0 3.31 2.69 6 6 6v4h-2v2h6v-2h-2v-4c3.31 0 6-2.69 6-6v-1a1 1 0 0 0-1-1h-3V4a2 2 0 0 0-2-2h-2z"/>
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.05em", color: "var(--ink-1)" }}>
                fork<span style={{ color: "#e05a1e" }}>map</span>
              </span>
            </Link>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.65, maxWidth: 200 }}>
              Find the best restaurants near you, powered by open data.
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--ink-4)" }}>
              © OpenStreetMap contributors
            </p>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.label}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                {col.label}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {col.links.map(l => (
                  <Link key={l.href} href={l.href} style={{ fontSize: 13, color: "var(--ink-2)", textDecoration: "none", fontWeight: 500, transition: "color 100ms" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--ink-1)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-2)")}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid rgba(28,25,23,0.06)",
          paddingTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}>
          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
            © {year} Forkmap · Restaurant data © OpenStreetMap contributors (ODbL)
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/attribution", label: "Attribution" },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 11, color: "var(--ink-4)", textDecoration: "none", transition: "color 100ms" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--ink-2)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-4)")}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
