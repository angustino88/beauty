import { useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { AuthError } from "@azure/msal-browser";
import { useAppDispatch } from "@/app/store";
import { getApiErrorMessage } from "@/shared/notifications";
import { authActions } from "../authSlice";
import { useAadLoginMutation, requestLoginCsrfToken } from "../api";
import { setCsrfToken } from "../session/csrf";
import { clearLoginCredentials, createLoginNonce, hasLoginNonceSecret, takeLoginCredentials } from "../session/loginNonce";

const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string;

// Module-level flag prevents concurrent autoLogin calls.
// Survives React StrictMode double-mount. Resets on full page reload.
let autoLoginStarted = false;

export function resetAutoLoginState(): void {
  autoLoginStarted = false;
  try {
    clearLoginCredentials();
  } catch {
    // Ignore storage errors
  }
}

function getLoginHint(
  instance: ReturnType<typeof useMsal>["instance"],
): string | undefined {
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
  return account?.username;
}

export function useLogin() {
  const { instance } = useMsal();
  const dispatch = useAppDispatch();
  const [aadLogin] = useAadLoginMutation();

  const loginToBackend = useCallback(
    async (idToken: string, nonceSecret: string) => {
      dispatch(authActions.setLogging(true));
      dispatch(authActions.setError(null));
      try {
        // Fetch a fresh CSRF cookie and token for this backend before POSTing.
        const csrf = await dispatch(requestLoginCsrfToken(undefined, { forceRefetch: true, subscribe: false })).unwrap();
        setCsrfToken(csrf.data.csrf_token);
        const result = await aadLogin({ aadLogin: { id_token: idToken, nonce_secret: nonceSecret } }).unwrap();
        const accessToken = result.data.access;
        if (!accessToken) {
          throw new Error("aad-login response missing access token");
        }
        if (result.data.csrf_token) {
          setCsrfToken(result.data.csrf_token);
        }
        dispatch(authActions.setAccessToken(accessToken));
      } catch (error: unknown) {
        const message = getApiErrorMessage(
          error,
          "We could not complete sign-in. Please try again or contact your lab administrator.",
        );
        dispatch(authActions.setError(message));
        throw error;
      } finally {
        dispatch(authActions.setLogging(false));
      }
    },
    [dispatch, aadLogin],
  );

  const autoLogin = useCallback(async () => {
    if (autoLoginStarted) return;
    if (!hasLoginNonceSecret()) return;
    autoLoginStarted = true;
    try {
      const credentials = takeLoginCredentials();
      if (!credentials) {
        dispatch(authActions.setError("Microsoft sign-in was not completed. Please try again."));
        return;
      }
      const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
      if (account) instance.setActiveAccount(account);
      await loginToBackend(credentials.idToken, credentials.nonceSecret);
    } catch {
      // loginToBackend already reports the backend failure to the user.
    } finally {
      autoLoginStarted = false;
    }
  }, [dispatch, instance, loginToBackend]);

  const handleManualLogin = useCallback(async () => {
    dispatch(authActions.setError(null));
    dispatch(authActions.setLogging(true));
    // Reset flag so post-redirect autoLogin can run after returning from Microsoft.
    autoLoginStarted = false;

    try {
      resetAutoLoginState();
      const nonce = await createLoginNonce();
      await instance.loginRedirect({
        scopes: ["openid", "profile", "offline_access"],
        loginHint: getLoginHint(instance),
        redirectUri: REDIRECT_URI,
        nonce,
      });
    } catch (error: unknown) {
      resetAutoLoginState();
      dispatch(authActions.setLogging(false));

      if (
        error instanceof AuthError &&
        error.errorCode === "interaction_in_progress"
      ) {
        dispatch(
          authActions.setError(
            "Microsoft sign-in is still being initialized. Please try again in a moment.",
          ),
        );
        return;
      }
      dispatch(
        authActions.setError(
          "Unable to start Microsoft sign-in. Check your connection and try again.",
        ),
      );
    }
  }, [dispatch, instance]);

  return { autoLogin, handleManualLogin, loginToBackend };
}
