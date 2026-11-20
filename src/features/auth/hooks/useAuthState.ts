// useAuthState.ts — convenience selector combining auth + me slices.
// Spread order: auth first (lower priority), me second (higher priority).
// No key collisions exist between the two slices as of today.
// Access checks use permissions (`useCan`, `usePermission`), never roles.
import { useAppSelector } from '@/app/store';
import type { PermissionSet } from '../permissions';

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
  permissions: PermissionSet;
  roles: string[];
}

export function useAuthState(): AuthStateResult {
  const auth = useAppSelector((s) => s.auth);
  const me = useAppSelector((s) => s.me);

  return { ...auth, ...me };
}
