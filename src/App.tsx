import { Suspense, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { ConfigProvider, theme as antdTheme } from "antd";
import { useLocation } from "react-router-dom";
import AppRoutes from "@/app/routes";
import { bootstrapAuth } from "@/features/auth/session/bootstrapAuth";
import { FullscreenLoading } from "@/components/layout/FullscreenLoading";
import { ThemeContext } from "@/shared/theme/ThemeContext";
import "./App.css";

const THEME_STORAGE_KEY = "labmango:theme";
const FONT_STACK =
  "\"Bosch Sans\", Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif";

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

  const themeContextValue = useMemo(
    () => ({ isDark, toggleTheme: () => setIsDark((current) => !current) }),
    [isDark],
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          components: {
            Badge: { statusSize: 10 },
          },
          // antd derives its palettes from literal colours, so these mirror the
          // --lm-* values in shared/styles/tokens.css. Keep both in sync.
          token: {
            colorPrimary: isDark ? "#2bb3a3" : "#0d8a7e",
            colorInfo: isDark ? "#4f8ff0" : "#3b82f6",
            colorSuccess: isDark ? "#34b56a" : "#22a05a",
            colorWarning: isDark ? "#e3a33a" : "#d98a0b",
            colorError: isDark ? "#ec5e66" : "#e5484d",
            fontFamily: FONT_STACK,
            colorLink: isDark ? "#5fd4c4" : "#0b6f65",
            colorBgLayout: isDark ? "#0b1117" : "#f4f6f8",
            colorBgContainer: isDark ? "#121a22" : "#ffffff",
            colorBgElevated: isDark ? "#18222d" : "#ffffff",
            colorFillAlter: isDark ? "#16202a" : "#f8fafb",
            colorText: isDark ? "#e6edf3" : "#14202b",
            colorTextSecondary: isDark ? "#8796a7" : "#64748b",
            colorBorder: isDark ? "#34455a" : "#cbd5df",
            colorBorderSecondary: isDark ? "#233040" : "#e2e8ee",
            borderRadius: 8,
            colorTextLightSolid: isDark ? "#04201d" : "#ffffff",
          },
        }}
      >
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
