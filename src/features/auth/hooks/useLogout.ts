import { useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAppDispatch } from '@/app/store';
import { authActions } from '../authSlice';
import { resetAutoLoginState } from './useLogin';
import { resetBootstrapAuthState } from '../session/bootstrapAuth';
import { clearCsrfToken } from '@/shared/lib/csrf';
import { meActions } from '../meSlice';
import { useLogoutMutation } from '../api';
import { notificationActions } from '@/features/notifications/notificationSlice';
import { clearShownAlerts } from '@/features/notifications/shownAlerts';
import { clearSelectedBackend } from '@/shared/lib/backendTarget';

export interface LogoutResult {
  /** Full logout: API blacklist → MSAL clear → Redux clear */
  handleFullLogout: () => Promise<void>;
  /** Redux-only clear (no API, no MSAL) — for error recovery */
  handleClearRedux: () => void;
}

export function useLogout(): LogoutResult {
  const { instance } = useMsal();
  const dispatch = useAppDispatch();
  const [logoutApi] = useLogoutMutation();

  const handleClearRedux = useCallback(() => {
    resetAutoLoginState();
    resetBootstrapAuthState();
    clearCsrfToken();
    clearShownAlerts();
    // Router mode: the next sign-in asks the Router again (the user may belong to another backend by then).
    clearSelectedBackend();
    dispatch(authActions.logout());
    dispatch(meActions.clearMe());
    dispatch(notificationActions.clearNotifications());
  }, [dispatch]);

  // Navigation to /login happens automatically via AppSideNav's
  // useEffect(() => { if (!isAuthenticated) navigate('/login') })
  const handleFullLogout = useCallback(async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Backend logout failure is non-fatal — proceed to clear client state
    }
    handleClearRedux();
    try {
      await instance.logoutRedirect({ postLogoutRedirectUri: '/login' });
    } catch {
      // MSAL logout failure is non-fatal — user is already cleared from Redux
    }
  }, [logoutApi, handleClearRedux, instance]);

  return { handleFullLogout, handleClearRedux };
}
