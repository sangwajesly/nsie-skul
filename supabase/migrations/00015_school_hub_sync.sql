-- ============================================================================
-- Migration: 00015_school_hub_sync.sql
-- Description: School Hub (LAN Edge Server) Architecture & Bi-directional Sync
--   1. school_hubs     - registered on-premise Hub nodes (Principal PC / mini-PC)
--                        running local LAN instances of NSEI Skul.
--   2. hub_sync_logs   - audit ledger of data pushes/pulls between local Hub and Cloud.
-- ============================================================================

-- 1. SCHOOL HUBS REGISTRY -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    hub_name TEXT NOT NULL DEFAULT 'Main Campus LAN Server',
    node_key TEXT NOT NULL UNIQUE,                 -- Cryptographic API Key for Hub-to-Cloud sync
    hardware_id TEXT NOT NULL,                     -- Machine fingerprint (CPU / MAC hash)
    local_ip TEXT,                                -- e.g. '192.168.1.100' or 'school.local'
    port INT NOT NULL DEFAULT 3000,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    lease_token TEXT,                             -- Signed HMAC lease token for offline authorization
    lease_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_sync_at TIMESTAMPTZ,
    last_sync_cursor TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_hubs_school ON public.school_hubs(school_id);
CREATE INDEX IF NOT EXISTS idx_school_hubs_node_key ON public.school_hubs(node_key);

ALTER TABLE public.school_hubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "School staff can view their hubs" ON public.school_hubs;
CREATE POLICY "School staff can view their hubs"
    ON public.school_hubs FOR SELECT
    USING (public.user_is_member(school_id));

DROP POLICY IF EXISTS "Admins can manage school hubs" ON public.school_hubs;
CREATE POLICY "Admins can manage school hubs"
    ON public.school_hubs FOR ALL
    USING (public.user_has_permission(school_id, 'school.manage_settings'));

-- 2. HUB SYNC AUDIT LOGS ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hub_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    hub_id UUID NOT NULL REFERENCES public.school_hubs(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('push', 'pull', 'bidirectional')),
    items_pushed INT NOT NULL DEFAULT 0,
    items_pulled INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    error_message TEXT,
    duration_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_sync_logs_hub ON public.hub_sync_logs(hub_id);
CREATE INDEX IF NOT EXISTS idx_hub_sync_logs_school ON public.hub_sync_logs(school_id);

ALTER TABLE public.hub_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "School members can view hub logs" ON public.hub_sync_logs;
CREATE POLICY "School members can view hub logs"
    ON public.hub_sync_logs FOR SELECT
    USING (public.user_is_member(school_id));
