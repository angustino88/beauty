// useAuthState.ts — convenience selector combining auth + me slices.
// Spread order: auth first (lower priority), me second (higher priority).
// No key collisions exist between the two slices as of today.
import { useAppSelector } from '@/app/store';

export interface AuthStateResult {
  // from auth slice
  accessToken: string | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  logging: boolean;
  error: string | null;
  // from me slice
  id: number | null;
  username: string;
  displayName: string;
  avatar: string | null;
  permissions: Record<string, boolean>;
  permissionGroups: Record<string, boolean>;
  // derived
  isCoordinator: boolean;
}

export function useAuthState(): AuthStateResult {
  const auth = useAppSelector((s) => s.auth);
  const me   = useAppSelector((s) => s.me);

  return {
    ...auth,
    ...me,
    isCoordinator:
      Boolean(me.permissionGroups['lab-coordinator']) ||
      Boolean(me.permissionGroups['coordinator']) ||
      Boolean(me.permissionGroups['admin']) ||
      Boolean(me.permissionGroups['administrator']) ||
      Boolean(me.permissionGroups['lab_coordinator']) ||
      Boolean(me.permissionGroups['Lab Coordinator']),
  };
}
