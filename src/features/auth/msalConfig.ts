import { EventType, InteractionType, PublicClientApplication, type AuthenticationResult, type Configuration } from '@azure/msal-browser';
import { clearLoginCredentials, storeRedirectIdToken } from './session/loginNonce';

// MSAL v5 configuration
// Credentials loaded from VITE_* env vars (not REACT_APP_* — this is Vite, not CRA)
// Dev redirect URI → http://localhost:3000/about (already registered in Azure AD from old project)
// Prod redirect URI → VITE_REDIRECT_URI in .env.production
const msalConfiguration: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID as string}`,
    // Always use VITE_REDIRECT_URI — dev uses http://localhost:3000/about (already
    // registered in Azure AD from old project), prod uses the registered prod URI.
    redirectUri: import.meta.env.VITE_REDIRECT_URI as string,
    postLogoutRedirectUri: '/login',
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    // Match old project: give ssoSilent iframe 10s before timing out.
    // MSAL v5 uses "iframeBridgeTimeout" (v3/4 was "iframeHashTimeout").
    // Default is too short and causes "redirect_bridge_timeout" errors on slow networks.
    iframeBridgeTimeout: 10000,
  },
};

// Singleton instance — passed to <MsalProvider instance={msalInstance}>
// MSAL v5: MsalProvider calls initialize() internally — no need to call it manually.
export const msalInstance = new PublicClientApplication(msalConfiguration);

// Registered before MsalProvider initializes and handles the redirect, so the
// response's one-time ID token is available even when /login mounts afterward.
msalInstance.addEventCallback((event) => {
  try {
    if (event.interactionType !== InteractionType.Redirect) return;
    // MSAL emits the AuthenticationResult here; LOGIN_SUCCESS only carries an account
    // and is not emitted when signing in to an account already in the cache.
    if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
      const result = event.payload as AuthenticationResult;
      if (result.idToken) storeRedirectIdToken(result.idToken);
    } else if (event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
      clearLoginCredentials();
    }
  } catch {
    clearLoginCredentials();
  }
});
