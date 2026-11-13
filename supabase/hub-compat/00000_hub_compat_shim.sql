-- ==============================================================================
-- Nsei Sukul School Hub — Local PostgreSQL Compatibility Shim
-- File: supabase/hub-compat/00000_hub_compat_shim.sql
-- Description: Mocks Supabase internal schemas (auth, extensions), roles,
--              and session functions (auth.uid(), auth.jwt(), auth.role())
--              to allow existing migrations 00001-00022 to execute identically
--              on an offline standalone local PostgreSQL cluster.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE SUPABASE EXTENSIONS SCHEMA & ROLES (IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END $$;

-- 3. MOCK SUPABASE AUTH SCHEMA
CREATE SCHEMA IF NOT EXISTS auth;

-- auth.users table for local staff authentication
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID,
    aud VARCHAR(255) DEFAULT 'authenticated',
    role VARCHAR(255) DEFAULT 'authenticated',
    email VARCHAR(255) UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ DEFAULT now(),
    invited_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_app_meta_data JSONB DEFAULT '{"provider":"email","providers":["email"]}',
    raw_user_meta_data JSONB DEFAULT '{}',
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    phone TEXT DEFAULT NULL,
    phone_confirmed_at TIMESTAMPTZ DEFAULT NULL,
    phone_change TEXT DEFAULT '',
    phone_change_token VARCHAR(255) DEFAULT '',
    phone_change_sent_at TIMESTAMPTZ DEFAULT NULL,
    confirmed_at TIMESTAMPTZ DEFAULT now(),
    email_change_token_current VARCHAR(255) DEFAULT '',
    email_change_confirm_status SMALLINT DEFAULT 0,
    banned_until TIMESTAMPTZ DEFAULT NULL,
    reauthentication_token VARCHAR(255) DEFAULT '',
    reauthentication_sent_at TIMESTAMPTZ DEFAULT NULL,
    is_sso_user BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Grant access on auth schema
GRANT USAGE ON SCHEMA auth TO PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO PUBLIC, anon, authenticated, service_role;

-- 4. SESSION CONTEXT SIMULATION FUNCTIONS
-- Allows Node.js pg connection pool to set request-scoped user context:
-- SET LOCAL request.jwt.claim.sub = 'uuid';
-- SET LOCAL request.jwt.claim.role = 'authenticated';

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT
LANGUAGE sql STABLE AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
$$;

CREATE OR REPLACE FUNCTION auth.email() RETURNS TEXT
LANGUAGE sql STABLE AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.email', true), '');
$$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB
LANGUAGE sql STABLE AS $$
    SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;

-- 5. HUB SYSTEM SCHEMA FOR OFFLINE SYNC AND OUTBOX
CREATE SCHEMA IF NOT EXISTS hub;

-- Local synchronization state and registration store
CREATE TABLE IF NOT EXISTS hub.node_state (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Local transactional mutation outbox
CREATE TABLE IF NOT EXISTS hub.sync_outbox (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    mutation_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    payload JSONB NOT NULL,
    client_version INT NOT NULL,
    actor_id UUID,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_FLIGHT', 'COMMITTED', 'FAILED')),
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hub_sync_outbox_pending
ON hub.sync_outbox (status, id ASC);
