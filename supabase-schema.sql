-- ============================================================
-- SHAYARI GALLERY — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── CATEGORIES TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  name_urdu   TEXT,
  slug        TEXT NOT NULL UNIQUE,
  emoji       TEXT DEFAULT '📂',
  description TEXT,
  active      BOOLEAN DEFAULT true,
  sort_order  INT DEFAULT 99,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── IMAGES TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS images (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  author      TEXT,
  category    TEXT NOT NULL,           -- matches categories.slug
  description TEXT,
  tags        TEXT[] DEFAULT '{}',
  status      TEXT DEFAULT 'live' CHECK (status IN ('live','draft')),
  url         TEXT NOT NULL,           -- Cloudinary secure_url
  public_id   TEXT NOT NULL,           -- Cloudinary public_id (for deletion)
  width       INT,
  height      INT,
  file_bytes  BIGINT,
  file_format TEXT,
  views       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── INDEXES for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category);
CREATE INDEX IF NOT EXISTS idx_images_status   ON images(status);
CREATE INDEX IF NOT EXISTS idx_images_created  ON images(created_at DESC);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
-- Images: anyone can read live images; only service role can write
ALTER TABLE images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read for live images
CREATE POLICY "Public can read live images"
  ON images FOR SELECT
  USING (status = 'live');

-- Service role key bypasses RLS (used in API routes)
-- No extra policy needed — service key has full access

-- Public read for active categories
CREATE POLICY "Public can read active categories"
  ON categories FOR SELECT
  USING (active = true);

-- ── SEED DEFAULT CATEGORIES ──────────────────────────────────
INSERT INTO categories (name, name_urdu, slug, emoji, sort_order) VALUES
  ('Urdu Poetry',    'اردو شاعری',      'urdu-poetry',    '📜', 1),
  ('Islamic Quotes', 'اسلامی اقوال',    'islamic-quotes', '☪️', 2),
  ('Mehndi Design',  'مہندی ڈیزائن',   'mehndi-design',  '🌿', 3),
  ('Motivational',   'حوصلہ افزا',     'motivational',   '⚡', 4),
  ('Love Shayari',   'محبت کی شاعری',  'love-shayari',   '❤️', 5),
  ('Sad Poetry',     'غمگین شاعری',    'sad-poetry',     '💔', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- DONE. Your tables are ready.
-- ============================================================
