-- ============================================================
-- sql/schema.sql — Supabase PostgreSQL schema v2
-- Supports real Supabase Auth user IDs (UUID)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: favorites
-- user_id is now TEXT to support both UUID auth users
-- and the "demo-user" fallback for unauthenticated sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  osm_id      TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  lat         DOUBLE PRECISION NOT NULL,
  lon         DOUBLE PRECISION NOT NULL,
  fsq_id      TEXT,
  snapshot    JSONB       NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, osm_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites (user_id);

-- ============================================================
-- Table: osm_fsq_mapping
-- ============================================================
CREATE TABLE IF NOT EXISTS osm_fsq_mapping (
  osm_id      TEXT        PRIMARY KEY,
  fsq_id      TEXT        NOT NULL,
  confidence  DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  matched_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Authenticated users see only their own favorites
CREATE POLICY "Users see own favorites" ON favorites
  FOR ALL
  USING (
    auth.uid()::TEXT = user_id
    OR user_id = 'demo-user'   -- fallback for unauthenticated
  )
  WITH CHECK (
    auth.uid()::TEXT = user_id
    OR user_id = 'demo-user'
  );

-- Allow service role to bypass RLS (used by server routes)
-- This is automatic for the service role key

-- ============================================================
-- Migration: if upgrading from demo schema
-- ============================================================
-- ALTER TABLE favorites ALTER COLUMN user_id TYPE TEXT;
-- UPDATE favorites SET user_id = 'demo-user' WHERE user_id = 'demo-user';
