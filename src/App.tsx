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
            colorPrimary: isDark ? "#6f62e6" : "#6155d9",
            colorInfo: isDark ? "#5b9af0" : "#3b7ddd",
            colorSuccess: isDark ? "#46b878" : "#2f9e62",
            colorWarning: isDark ? "#e5a238" : "#d48a10",
            colorError: isDark ? "#ea6274" : "#d9475a",
            fontFamily: FONT_STACK,
            colorLink: isDark ? "#b8b0ff" : "#5146b9",
            colorBgLayout: isDark ? "#14171c" : "#f5f6fa",
            colorBgContainer: isDark ? "#1d2127" : "#ffffff",
            colorBgElevated: isDark ? "#262b33" : "#ffffff",
            colorFillAlter: isDark ? "#232830" : "#f8f9fb",
            colorText: isDark ? "#e8eaed" : "#202536",
            colorTextSecondary: isDark ? "#959cab" : "#717789",
            colorBorder: isDark ? "#4a525f" : "#cfd4de",
            colorBorderSecondary: isDark ? "#333a44" : "#e4e7ee",
            borderRadius: 8,
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
