import { Suspense, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { ConfigProvider, theme as antdTheme, type ThemeConfig } from "antd";
import { useLocation } from "react-router-dom";
import AppRoutes from "@/app/routes";
import { bootstrapAuth } from "@/features/auth/session/bootstrapAuth";
import { FullscreenLoading } from "@/components/layout/FullscreenLoading";
import { ThemeContext } from "@/shared/theme/ThemeContext";
import { ToastViewport } from "@/shared/notifications";
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
        Modal: {
          borderRadiusLG: 10,
          titleFontSize: 16,
        },
        Alert: {
          borderRadiusLG: 8,
          defaultPadding: "10px 14px",
        },
        ...(isDark && {
          Button: {
            defaultHoverColor: "#c4b7fa",
            defaultActiveColor: "#d8ceff",
            dangerColor: "#15161b",
          },
          Input: { activeBorderColor: "#b6a4ff" },
          Pagination: {
            itemActiveBg: "#231d3d",
            itemActiveColor: "#c4b7fa",
            itemActiveColorHover: "#d8ceff",
          },
          Table: {
            headerColor: "#b9bdcc",
            rowHoverBg: "#23252d",
          },
        }),
      },
      // Ant Design's palette algorithm takes literal colors. Shared values
      // mirror the semantic tokens in shared/styles/tokens.css.
      token: {
        colorPrimary: isDark ? "#7053d2" : "#6d3fd6",
        colorInfo: isDark ? "#4a84de" : "#3b82f6",
        colorSuccess: isDark ? "#2f9e63" : "#1f9d57",
        colorWarning: isDark ? "#d39a37" : "#c27803",
        colorError: isDark ? "#e37d87" : "#e0454b",
        fontFamily: FONT_STACK,
        colorLink: isDark ? "#c4b7fa" : "#5a2fc0",
        colorBgLayout: isDark ? "#15161b" : "#f6f5f9",
        colorBgContainer: isDark ? "#1d1f26" : "#ffffff",
        colorBgElevated: isDark ? "#252730" : "#ffffff",
        colorFillAlter: isDark ? "#23252d" : "#faf9fc",
        colorText: isDark ? "#e3e4eb" : "#1a1723",
        colorTextSecondary: isDark ? "#b9bdcc" : "#6b6679",
        colorTextPlaceholder: isDark ? "#a4a8ba" : "#6b6679",
        colorBorder: isDark ? "#74798c" : "#cdc8d9",
        colorBorderSecondary: isDark ? "#373a46" : "#e4e1ec",
        borderRadius: 8,
        colorTextLightSolid: "#ffffff",
        ...(isDark && {
          colorTextTertiary: "#a4a8ba",
          colorTextQuaternary: "#898da0",
          colorTextDisabled: "#777b8d",
          colorPrimaryHover: "#7859d8",
          colorPrimaryActive: "#6246bf",
          colorPrimaryText: "#c4b7fa",
          colorPrimaryTextHover: "#d8ceff",
          colorPrimaryBg: "#231d3d",
          colorPrimaryBgHover: "#30254d",
          colorPrimaryBorder: "#b6a4ff",
          colorLinkHover: "#d8ceff",
          colorLinkActive: "#b6a4ff",
          colorInfoBg: "#172b44",
          colorInfoBorder: "#39577d",
          colorInfoText: "#a5cfff",
          colorSuccessBg: "#142b1f",
          colorSuccessBorder: "#2f6346",
          colorSuccessText: "#76dba1",
          colorWarningBg: "#2a2213",
          colorWarningBorder: "#6a512a",
          colorWarningText: "#e0b661",
          colorErrorBg: "#31191d",
          colorErrorBorder: "#57282e",
          colorErrorHover: "#ed939b",
          colorErrorActive: "#d9727d",
          colorErrorText: "#f1a4aa",
          colorBgTextHover: "#2b2d36",
          controlItemBgHover: "#2b2d36",
          controlOutline: "rgba(182, 164, 255, 0.35)",
        }),
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
        <ToastViewport />
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
