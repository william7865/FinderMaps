-- ============================================================
-- sql/schema.sql — Supabase PostgreSQL schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: favorites
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     TEXT        NOT NULL,
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
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites (user_id);

-- ============================================================
-- Table: osm_fsq_mapping
-- Cache of matched OSM -> Foursquare IDs to avoid re-matching
-- ============================================================
CREATE TABLE IF NOT EXISTS osm_fsq_mapping (
  osm_id      TEXT        PRIMARY KEY,
  fsq_id      TEXT        NOT NULL,
  confidence  DOUBLE PRECISION NOT NULL DEFAULT 1.0,  -- 0-1
  matched_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
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
