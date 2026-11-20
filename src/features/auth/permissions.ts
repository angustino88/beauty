/**
 * Labs permissions: what the signed-in user may do (backend role-based access design).
 *
 * The backend decides who holds each permission (`core/users/permissions.py` in Lab Mango; generated matrix
 * `docs/architecture/access-matrix.md`) and sends the user's permissions in
 * `GET /api/users/me` → `effective_permissions.labs` (`{ value, label }` items). The UI shows or hides actions
 * with these codes and never checks a role: changing who may do something is a backend change only.
 * The server stays authoritative: every action still handles 403.
 *
 * Keep this list in step with the backend registry. A code the backend sends that is not listed here is kept
 * (and still checked by `can`), so a newer backend never breaks the UI.
 */
export const LABS_PERMISSIONS = [
  // Lab Member
  'dashboard.read',
  'leaderboard.read',
  'bench_booking.manage_own',
  'organization.read',
  // Lab Coordinator (lab operator)
  'lab_operations.manage',
  'finance.manage',
  'bench_booking.manage_any',
  'bench_booking.approve',
  'bench_booking.book_during_downtime',
  'assessment.read_any',
  'reference_data.import',
  'agent.manage',
  'support.handle',
  // Lab Administrator
  'equipment_reference.manage',
  'license_check.manage',
  'workbook.import',
  'telemetry_profile.approve',
  'support.administer',
  'directory.read',
] as const;

export type LabsPermission = (typeof LABS_PERMISSIONS)[number];

/** The permission codes a user holds, as a lookup. */
export type PermissionSet = Readonly<Record<string, true>>;

interface EffectivePermissionsPayload {
  labs?: ReadonlyArray<{ value?: unknown } | string> | null;
}

/** Builds the lookup from `effective_permissions` of `GET /api/users/me`. Anything malformed grants nothing. */
export function permissionSetFrom(effective?: EffectivePermissionsPayload | null): PermissionSet {
  const held: Record<string, true> = {};
  if (!effective || !Array.isArray(effective.labs)) return held;
  for (const item of effective.labs) {
    const code = typeof item === 'string' ? item : item?.value;
    if (typeof code === 'string' && code.trim()) held[code.trim()] = true;
  }
  return held;
}

/** Whether `permissions` holds `permission`. Deny by default. */
export function holds(permissions: PermissionSet | null | undefined, permission: LabsPermission): boolean {
  return Boolean(permissions?.[permission]);
}
