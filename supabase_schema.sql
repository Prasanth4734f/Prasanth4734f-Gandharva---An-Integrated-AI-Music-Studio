-- Supabase Database Schema for Gandharva Nusic

-- 1. Create the Storage Bucket for Audio Assets
insert into storage.buckets (id, name, public) values ('nusic-assets', 'nusic-assets', true);

-- 2. Create the Tracks Table (Generated Songs)
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    style TEXT,
    final_audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the Lyrics Table
CREATE TABLE IF NOT EXISTS public.lyrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    genre TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create the Studio Recordings Table
CREATE TABLE IF NOT EXISTS public.studio_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument TEXT NOT NULL, -- e.g., 'Piano', 'Drum'
    name TEXT NOT NULL,
    data JSONB NOT NULL,      -- Stores the array of note events
    duration NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We are making everything public for MVP to bypass Row Level Security rules.
-- In production, you should enable RLS and require users to authenticate.

-- Disable RLS temporarily to allow the app to insert data easily
ALTER TABLE public.tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lyrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_recordings DISABLE ROW LEVEL SECURITY;
