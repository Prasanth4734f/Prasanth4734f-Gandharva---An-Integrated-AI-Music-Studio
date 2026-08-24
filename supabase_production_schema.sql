-- ==============================================================================
-- GANDHARVA AI MUSIC STUDIO - COMPLETE PRODUCTION SUPABASE DATABASE & AUTH SCHEMA
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('music', 'music', true),
    ('exports', 'exports', true),
    ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- 3. PROFILES TABLE (Linked directly to auth.users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'artist' CHECK (role IN ('admin', 'artist', 'guest')),
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'studio')),
    avatar_url TEXT,
    generation_credits INT DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    genre TEXT,
    mood TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LYRICS TABLE
CREATE TABLE IF NOT EXISTS public.lyrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    prompt TEXT,
    language TEXT DEFAULT 'Tamil',
    genre TEXT DEFAULT 'Pop',
    emotion TEXT DEFAULT 'Inspiring',
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MUSIC TABLE
CREATE TABLE IF NOT EXISTS public.music (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    prompt TEXT,
    model TEXT DEFAULT 'musicgen-melody',
    duration NUMERIC DEFAULT 30,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. GENERATIONS TABLE (Full AI History)
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('music', 'lyrics', 'vocal', 'stem')),
    model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    result_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. USER PREFERENCES TABLE (Telugu & MP3 320 Defaults)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    audio_format TEXT NOT NULL DEFAULT 'mp3_320',
    lyrics_language TEXT NOT NULL DEFAULT 'te',
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. AUTOMATIC PROFILE & PREFERENCES CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, display_name, role, auth_provider)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        CASE 
            WHEN LOWER(NEW.email) IN ('admin@gandharva.com', 'admin@gandharvasound.com', 'prasanthm4734h@gmail.com') OR LOWER(NEW.email) LIKE 'admin@%' THEN 'admin'
            ELSE 'artist'
        END,
        COALESCE(NEW.raw_app_meta_data->>'provider', NEW.raw_user_meta_data->>'provider', 'google')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        auth_provider = COALESCE(EXCLUDED.auth_provider, public.profiles.auth_provider),
        updated_at = NOW();
    
    -- Insert default user preferences (Telugu 'te' & MP3 320 default)
    INSERT INTO public.user_preferences (user_id, audio_format, lyrics_language, notifications_enabled)
    VALUES (
        NEW.id,
        'mp3_320',
        'te',
        true
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert default connected service for the auth provider
    INSERT INTO public.connected_services (user_id, provider, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_app_meta_data->>'provider', 'google'),
        'connected'
    )
    ON CONFLICT (user_id, provider) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. CONNECTED SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.connected_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected',
    metadata JSONB DEFAULT '{}'::jsonb,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- 11. ROW LEVEL SECURITY (RLS) ENFORCEMENT

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lyrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_services ENABLE ROW LEVEL SECURITY;

-- Helper admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles viewable by owner or admin" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles updatable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles updatable by owner or admin" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- USER PREFERENCES POLICIES
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- CONNECTED SERVICES POLICIES
DROP POLICY IF EXISTS "Users manage own connected services" ON public.connected_services;
CREATE POLICY "Users manage own connected services" ON public.connected_services
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- PROJECTS POLICIES
DROP POLICY IF EXISTS "Users manage own projects" ON public.projects;
CREATE POLICY "Users manage own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- LYRICS POLICIES
DROP POLICY IF EXISTS "Users manage own lyrics" ON public.lyrics;
CREATE POLICY "Users manage own lyrics" ON public.lyrics
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- MUSIC POLICIES
DROP POLICY IF EXISTS "Users manage own music" ON public.music;
CREATE POLICY "Users manage own music" ON public.music
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- GENERATIONS POLICIES
DROP POLICY IF EXISTS "Users manage own generations" ON public.generations;
CREATE POLICY "Users manage own generations" ON public.generations
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());
