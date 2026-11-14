import { useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAppDispatch } from '@/app/store';
import { authActions } from '../authSlice';
import { resetAutoLoginState } from './useLogin';
import { resetBootstrapAuthState } from '../session/bootstrapAuth';
import { clearCsrfToken } from '../session/csrf';
import { meActions } from '../meSlice';
import { useLogoutMutation } from '../api';
import { notificationActions } from '@/features/notifications/notificationSlice';

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
