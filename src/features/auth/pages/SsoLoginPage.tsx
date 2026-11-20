import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { CustomerServiceOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Spin } from "antd";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { LogoBosch } from "@/components/svg";
import { authActions } from "../authSlice";
import { meActions, meFromUser } from "../meSlice";
import { useGetMeQuery } from "../api";
import { useLogin } from "../hooks/useLogin";
import lockImage from "@/assets/lock.svg";
import {
  useLoginStyles,
  PAGE_STYLE,
  DIVIDER_STYLE,
} from "./SsoLoginPage.styles";

const INSTRUCTION_URL =
  "https://example.com";

/**
 * Thin UI shell — all login logic lives in useLogin hook.
 * The redirect result is exchanged once with the backend after MSAL finishes.
 */
export default function SsoLoginPage() {
  const RETURN_TO_KEY = "lm:returnTo";
  const { inProgress } = useMsal();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const bootstrapStatus = useAppSelector((state) => state.auth.bootstrapStatus);
  const authError = useAppSelector((state) => state.auth.error);
  const logging = useAppSelector((state) => state.auth.logging);
  const navigate = useNavigate();
  const location = useLocation();
  const { styles } = useLoginStyles();

  const { autoLogin, handleManualLogin } = useLogin();
  const { data: meData, isLoading: isMeLoading } = useGetMeQuery(undefined, {
    skip: !isLoggedIn || bootstrapStatus !== "authenticated",
  });
  const resolveReturnPath = useCallback(() => {
    const stateObj = location.state as {
      from?: { pathname?: string; search?: string; hash?: string };
    } | null;
    const from = stateObj?.from;
    const fromPath = from?.pathname
      ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
      : null;
    const stored = sessionStorage.getItem(RETURN_TO_KEY);
    const candidate = fromPath || stored;
    // ← Exclude '/' to prevent blank screen
    if (candidate && candidate.startsWith("/") && candidate !== "/")
      return candidate;
    return "/dashboard";
  }, [location.state]);

  // Spinner: only during backend call OR when MSAL is processing a redirect/startup.
  // Do NOT spin for 'AcquireToken' alone — that's background and should be transparent.
  const msalBusy =
    inProgress === InteractionStatus.HandleRedirect ||
    inProgress === InteractionStatus.Startup ||
    inProgress === InteractionStatus.AcquireToken;
  const isLoading =
    logging ||
    msalBusy ||
    bootstrapStatus === "loading" ||
    (isLoggedIn && isMeLoading);

  // Clear stale persisted error on mount
  useEffect(() => {
    dispatch(authActions.setError(null));
  }, [dispatch]);

  // When me data arrives, populate me slice and navigate back to target route.
  useEffect(() => {
    if (!meData) return;
    const user = meData.data;
    dispatch(meActions.setMe(meFromUser(user)));
    const returnPath = resolveReturnPath();
    sessionStorage.removeItem(RETURN_TO_KEY);
    navigate(returnPath, { replace: true });
  }, [meData, dispatch, navigate, resolveReturnPath]);

  // Fire auto-login once MSAL finishes any in-flight interaction (startup / handleRedirect).
  // Do NOT depend on inProgress for ongoing silent ops — those run in background.
  useEffect(() => {
    if (isLoggedIn || bootstrapStatus === "loading") return;
    if (inProgress === InteractionStatus.None) {
      void autoLogin();
    }
    // Only run when inProgress transitions to None (startup done, redirect processed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress, bootstrapStatus, isLoggedIn]);

  return (
    <div style={PAGE_STYLE}>
      <Card className={styles.card}>
        <div className={styles.logoBrand}>
          <LogoBosch />
        </div>

        <div style={DIVIDER_STYLE} />

        {authError && !isLoading ? (
          <div className={styles.restrictedContent}>
            <div className={styles.restrictedIcon} aria-hidden="true">
              <img className={styles.lockImage} src={lockImage} alt="" />
            </div>
            <h1 className={styles.restrictedTitle}>Sign-in failed</h1>
            <p className={styles.restrictedDescription} role="alert">{authError}</p>
            <div className={styles.contentDivider} />
            <Button
              className={styles.tryAgainButton}
              icon={<ReloadOutlined />}
              onClick={() => void handleManualLogin()}
            >
              Try Again
            </Button>
            <div className={styles.helpFooter}>
              <CustomerServiceOutlined />
              <span>Need help?</span>
              <a
                href={INSTRUCTION_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                View instructions
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.subtitle}>
              Sign in with your Bosch account to continue
            </div>
            <div className={styles.actionArea}>
              {isLoading ? (
                <Spin size="large" description="Signing in with Microsoft..." />
              ) : (
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => void handleManualLogin()}
                >
                  Log In
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
