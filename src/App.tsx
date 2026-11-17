import { Suspense, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { ConfigProvider, theme as antdTheme, type ThemeConfig } from "antd";
import { useLocation } from "react-router-dom";
import AppRoutes from "@/app/routes";
import { bootstrapAuth } from "@/features/auth/session/bootstrapAuth";
import { FullscreenLoading } from "@/components/layout/FullscreenLoading";
import { ThemeContext } from "@/shared/theme/ThemeContext";
import "./App.css";

const THEME_STORAGE_KEY = "labmango:theme";
const FONT_STACK =
  "\"Inter Variable\", Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif";

export default function App() {
  const dispatch = useAppDispatch();
  const bootstrapStatus = useAppSelector((state) => state.auth.bootstrapStatus);
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "dark" || stored === "light") return stored === "dark";
    } catch {
      // Storage can be blocked; fall through to the OS preference.
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  const isRedirectRoute =
    location.pathname === "/auth/redirect" || location.pathname === "/about";

  useEffect(() => {
    if (bootstrapStatus !== "loading" || isRedirectRoute) return;
    void bootstrapAuth(dispatch);
  }, [dispatch, bootstrapStatus, isRedirectRoute]);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // Theme still works for this session when storage is unavailable.
    }
  }, [isDark]);

  const antdThemeConfig = useMemo<ThemeConfig>(
    () => ({
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    components: {
      Badge: { statusSize: 10 },
      Message: { contentPadding: "10px 16px" },
    },
    // antd derives its palettes from literal colours, so these mirror the
    // --lm-* values in shared/styles/tokens.css. Keep both in sync.
    token: {
      colorPrimary: isDark ? "#7458e0" : "#6d3fd6",
      colorInfo: isDark ? "#4a84de" : "#3b82f6",
      colorSuccess: isDark ? "#2f9e63" : "#1f9d57",
      colorWarning: isDark ? "#d39a37" : "#c27803",
      colorError: isDark ? "#d9575f" : "#e0454b",
      fontFamily: FONT_STACK,
      colorLink: isDark ? "#b3a3f5" : "#5a2fc0",
      colorBgLayout: isDark ? "#121317" : "#f6f5f9",
      colorBgContainer: isDark ? "#1c1d23" : "#ffffff",
      colorBgElevated: isDark ? "#24252c" : "#ffffff",
      colorFillAlter: isDark ? "#212228" : "#faf9fc",
      colorText: isDark ? "#dcdde4" : "#1a1723",
      colorTextSecondary: isDark ? "#8f919e" : "#6b6679",
      colorBorder: isDark ? "#43454f" : "#cdc8d9",
      colorBorderSecondary: isDark ? "#30323a" : "#e4e1ec",
      borderRadius: 8,
      colorTextLightSolid: "#ffffff",
    },
  }),
    [isDark],
  );

  // antd's static message / notification / Modal.confirm render outside this provider, so without a holder they
  // stay light-themed in dark mode. Wrap their holder in the same theme.
  useEffect(() => {
    ConfigProvider.config({
      holderRender: (children) => <ConfigProvider theme={antdThemeConfig}>{children}</ConfigProvider>,
    });
  }, [antdThemeConfig]);

  const themeContextValue = useMemo(
    () => ({ isDark, toggleTheme: () => setIsDark((current) => !current) }),
    [isDark],
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ConfigProvider theme={antdThemeConfig}>
        <Suspense fallback={<FullscreenLoading />}>
          {bootstrapStatus === "loading" && !isRedirectRoute ? (
            <FullscreenLoading />
          ) : (
            <AppRoutes />
          )}
        </Suspense>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
