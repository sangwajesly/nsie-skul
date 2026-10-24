-- Restore the leadership permissions expected by a school principal and administrator.
-- These are school-wide controls for academic, staffing, and student operations.
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p
  ON p.code IN (
    'school.settings.manage',
    'staff.manage',
    'students.view_all',
    'students.manage',
    'students.import_export',
    'academics.manage',
    'schemes.manage',
    'assignments.manage',
    'marks.view_all',
    'results.approve_school',
    'report_cards.generate',
    'attendance.view_all',
    'audit.view'
  )
WHERE r.code IN ('school_admin', 'principal')
ON CONFLICT (role_id, permission_id) DO NOTHING;