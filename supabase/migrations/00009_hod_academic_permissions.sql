-- Allow Heads of Department (HOD) to assign teachers, manage classes/streams, and configure coefficients.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'hod'
  AND p.code IN (
    'assignments.manage',
    'academics.manage',
    'schemes.manage'
  )
ON CONFLICT DO NOTHING;
