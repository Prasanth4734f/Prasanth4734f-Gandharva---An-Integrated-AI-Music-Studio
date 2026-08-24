-- Supabase RBAC & User Authorization Schema for Gandharva AI Music Studio

-- 1. Create Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'artist' CHECK (role IN ('admin', 'artist', 'guest')),
    tier TEXT DEFAULT 'free',
    generation_credits INT DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Automatic Profile Creation Trigger when a User Signs Up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE 
            WHEN LOWER(NEW.email) IN ('admin@gandharva.com', 'admin@gandharvasound.com', 'prasanthm4734h@gmail.com') OR LOWER(NEW.email) LIKE 'admin@%' THEN 'admin'
            ELSE 'artist'
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure user_id column exists on all content tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tracks' AND column_name = 'user_id') THEN
        ALTER TABLE public.tracks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lyrics' AND column_name = 'user_id') THEN
        ALTER TABLE public.lyrics ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'studio_recordings' AND column_name = 'user_id') THEN
        ALTER TABLE public.studio_recordings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        CREATE TABLE public.projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            genre TEXT,
            mood TEXT,
            prompt TEXT,
            language TEXT,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'user_id') THEN
        ALTER TABLE public.projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Enable Row Level Security (RLS) across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lyrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function to Check Admin Role in RLS Policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Row Level Security Policies

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- PROJECTS POLICIES
DROP POLICY IF EXISTS "Users access own projects" ON public.projects;
CREATE POLICY "Users access own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- TRACKS POLICIES
DROP POLICY IF EXISTS "Users access own tracks" ON public.tracks;
CREATE POLICY "Users access own tracks" ON public.tracks
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- LYRICS POLICIES
DROP POLICY IF EXISTS "Users access own lyrics" ON public.lyrics;
CREATE POLICY "Users access own lyrics" ON public.lyrics
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- STUDIO RECORDINGS POLICIES
DROP POLICY IF EXISTS "Users access own recordings" ON public.studio_recordings;
CREATE POLICY "Users access own recordings" ON public.studio_recordings
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());
