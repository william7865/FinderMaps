// ============================================================
// lib/hooks/useAuth.ts
// Supabase Auth hook — email/password + Google OAuth
// Works with Supabase's built-in auth (no NextAuth needed)
// ============================================================
"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createClient, type SupabaseClient, type User, type Session } from "@supabase/supabase-js";

// ── Browser client (anon key, safe to expose) ─────────────
function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

let _client: SupabaseClient | null = null;
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!_client) _client = getClient();
  return _client;
}

// ── Types ──────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  // Actions
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

// ── Hook ───────────────────────────────────────────────────
export function useAuth(): AuthState {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sb = getSupabaseBrowserClient();

  useEffect(() => {
    // Get initial session
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [sb]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, [sb]);

  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    const { error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    return error?.message ?? null;
  }, [sb]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined,
      },
    });
    return error?.message ?? null;
  }, [sb]);

  const signOut = useCallback(async () => {
    await sb.auth.signOut();
  }, [sb]);

  return { user, session, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut };
}
