-- Restore the settings and staff permissions expected by the school leadership UI.
-- School Administrator already receives all permissions; Principal needs these
-- specific grants to configure school settings and manage staff.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p
  ON p.code IN ('school.settings.manage', 'staff.manage')
WHERE r.code IN ('school_admin', 'principal')
ON CONFLICT (role_id, permission_id) DO NOTHING;