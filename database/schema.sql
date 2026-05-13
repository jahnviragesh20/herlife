-- HerLife Production Database Schema
-- Focus: Row-Level Security (RLS) and Zero-Trust Data Access

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Users table (Extends Auth Users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY, -- Matches auth.uid()
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trusted Contacts
CREATE TABLE public.trusted_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT,
    is_emergency_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Encrypted Aura Chats
CREATE TABLE public.encrypted_aura_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    encrypted_payload TEXT NOT NULL, -- Client-side AES-GCM
    iv TEXT NOT NULL, -- Initialization Vector
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Emergency Sessions
CREATE TABLE public.emergency_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('active', 'resolved', 'cancelled')) DEFAULT 'active',
    reason TEXT,
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- 3. ENABLE ROW LEVEL SECURITY

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_aura_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_sessions ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (Deny-by-Default is implicit)

-- Users: Can only read/update their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Trusted Contacts: Strict ownership
CREATE POLICY "Users can manage own contacts"
ON public.trusted_contacts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Encrypted Aura Chats: Strict ownership
CREATE POLICY "Users can manage own chats"
ON public.encrypted_aura_chats FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Emergency Sessions: Strict ownership
CREATE POLICY "Users can manage own emergency sessions"
ON public.emergency_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. FUNCTIONS & TRIGGERS

-- Automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
