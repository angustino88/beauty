import { useCallback } from 'react';
import { useAppSelector } from '@/app/store';
import { holds, type LabsPermission } from '../permissions';

/**
 * `can(permission)` for the signed-in user, from `GET /api/users/me` → `effective_permissions`.
 * Use it to show or hide actions; the server still decides (handle 403).
 */
export function useCan(): (permission: LabsPermission) => boolean {
  const permissions = useAppSelector((state) => state.me.permissions);
  return useCallback((permission: LabsPermission) => holds(permissions, permission), [permissions]);
}

/** Whether the signed-in user holds one permission. */
export function usePermission(permission: LabsPermission): boolean {
  return useAppSelector((state) => holds(state.me.permissions, permission));
}
