-- ============================================
-- Gandharva GPU Registry Table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This table stores the live Kaggle GPU ngrok URL
-- so the app auto-detects the backend without manual .env updates.
-- ============================================

CREATE TABLE IF NOT EXISTS gpu_registry (
  id TEXT PRIMARY KEY DEFAULT 'kaggle-primary',
  ngrok_url TEXT NOT NULL,
  status TEXT DEFAULT 'online',
  gpu_count INTEGER DEFAULT 0,
  engine_name TEXT DEFAULT 'Gandharva Dual-Brain',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public read access (frontend needs to read the URL)
ALTER TABLE gpu_registry ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read gpu_registry" 
  ON gpu_registry FOR SELECT 
  USING (true);

-- Service role can insert/update (backend uses service role key)
CREATE POLICY "Service role can manage gpu_registry" 
  ON gpu_registry FOR ALL 
  USING (true);

-- Insert a default row (will be updated by Kaggle on startup)
INSERT INTO gpu_registry (id, ngrok_url, status, gpu_count, engine_name)
VALUES ('kaggle-primary', 'none', 'offline', 0, 'Gandharva Dual-Brain')
ON CONFLICT (id) DO NOTHING;
