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

export default function App() {
  const dispatch = useAppDispatch();
  const bootstrapStatus = useAppSelector((state) => state.auth.bootstrapStatus);
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
    } catch {
      return false;
    }
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
          token: {
            colorPrimary: "#1f7a4d",
            fontFamily: "Bosch Sans",
            colorLink: isDark ? "#72c99a" : "#17633e",
            colorBgLayout: isDark ? "#171a1f" : "#f5f3ef",
            colorBgContainer: isDark ? "#22262d" : "#ffffff",
            colorText: isDark ? "#e8eaed" : "#292d33",
            colorTextSecondary: isDark ? "#a4aab4" : "#6d737b",
            colorBorder: isDark ? "#3c424b" : "#dedbd5",
            colorBorderSecondary: isDark ? "#323841" : "#ece9e3",
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
