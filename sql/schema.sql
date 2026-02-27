-- ============================================================
<<<<<<< HEAD
-- sql/schema.sql — Supabase PostgreSQL schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
=======
-- sql/schema.sql — Supabase PostgreSQL schema v2
-- Supports real Supabase Auth user IDs (UUID)
-- ============================================================

>>>>>>> f265c4a (FinderMaps)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: favorites
<<<<<<< HEAD
=======
-- user_id is now TEXT to support both UUID auth users
-- and the "demo-user" fallback for unauthenticated sessions
>>>>>>> f265c4a (FinderMaps)
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     TEXT        NOT NULL,
<<<<<<< HEAD
  osm_id      TEXT        NOT NULL,          -- e.g. "node/123456"
  name        TEXT        NOT NULL,
  lat         DOUBLE PRECISION NOT NULL,
  lon         DOUBLE PRECISION NOT NULL,
  fsq_id      TEXT,                          -- Foursquare ID if matched
  snapshot    JSONB       NOT NULL,          -- Full PlaceCard snapshot
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, osm_id)
);

-- Index for fast user lookups
=======
  osm_id      TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  lat         DOUBLE PRECISION NOT NULL,
  lon         DOUBLE PRECISION NOT NULL,
  fsq_id      TEXT,
  snapshot    JSONB       NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, osm_id)
);

>>>>>>> f265c4a (FinderMaps)
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites (user_id);

-- ============================================================
-- Table: osm_fsq_mapping
<<<<<<< HEAD
-- Cache of matched OSM -> Foursquare IDs to avoid re-matching
=======
>>>>>>> f265c4a (FinderMaps)
-- ============================================================
CREATE TABLE IF NOT EXISTS osm_fsq_mapping (
  osm_id      TEXT        PRIMARY KEY,
  fsq_id      TEXT        NOT NULL,
<<<<<<< HEAD
  confidence  DOUBLE PRECISION NOT NULL DEFAULT 1.0,  -- 0-1
=======
  confidence  DOUBLE PRECISION NOT NULL DEFAULT 1.0,
>>>>>>> f265c4a (FinderMaps)
  matched_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
<<<<<<< HEAD
-- Row Level Security (optional, for multi-user apps)
-- ============================================================

-- Enable RLS on favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- For demo, allow all (restrict in production via auth)
CREATE POLICY "allow_all_favorites" ON favorites
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Example data for testing
-- ============================================================
INSERT INTO favorites (user_id, osm_id, name, lat, lon, snapshot)
VALUES (
  'demo-user',
  'node/123456789',
  'Café de Flore',
  48.8540,
  2.3337,
  '{
    "osm_id": "node/123456789",
    "osm_type": "node",
    "name": "Café de Flore",
    "lat": 48.854,
    "lon": 2.3337,
    "tags": {"amenity": "cafe", "cuisine": "french"},
    "cuisine": "French",
    "is_favorite": true
  }'::jsonb
)
ON CONFLICT DO NOTHING;
=======
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
>>>>>>> f265c4a (FinderMaps)
