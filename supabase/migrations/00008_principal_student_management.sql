-- Ensure principal users can manage the full school academic and student setup.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'principal'
  AND p.code IN (
    'students.manage',
    'students.import_export',
    'academics.manage',
    'schemes.manage',
    'assignments.manage',
    'school.settings.manage',
    'staff.manage'
  )
ON CONFLICT DO NOTHING;
