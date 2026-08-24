-- 1. Create the Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) on the Admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow anyone to read the admins table (or restrict to authenticated users)
-- This allows the client side to query if the current user is in the admins table
CREATE POLICY "Allow public read access to admins" ON public.admins
    FOR SELECT USING (true);

-- 4. Helper function to make an existing user an admin (Replace with actual user ID)
-- INSERT INTO public.admins (id) VALUES ('YOUR_USER_ID_HERE');
