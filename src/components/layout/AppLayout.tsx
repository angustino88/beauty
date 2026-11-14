import { Layout } from "antd";
import { createStyles } from "antd-style";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import AppSideNav from "./AppSideNav";
import styleCss from "./layout.module.css";
import { OfflineNotification } from "./OfflineNotification";
import { useGetMeQuery } from "@/features/auth/api";
import { meActions, flattenEffectiveRoles } from "@/features/auth/meSlice";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { ChatWidget } from "@/features/chat-widget";
import { useNotificationsWebSocket } from "@/features/notifications/hooks/useNotificationsWebSocket";
import { useAppDispatch } from "@/app/store";
import { NotificationBanner } from "@/features/notifications/components/NotificationBanner";
import { FullscreenLoading } from "./FullscreenLoading";
import { useLabsAnalyticsLabVisitsCreateMutation } from "@/shared/api/generated/api";
import { baseApi } from "@/shared/lib/api";

const useStyles = createStyles(() => ({
  content: {
    margin: "20px",
    minHeight: 280,
    minWidth: 0,
    width: "auto !important",
    overflowY: "auto",
  },
}));

const { Content } = Layout;

export function AppLayout() {
  const { styles } = useStyles();
  const [collapsed, setCollapsed] = useState(
    () => window.matchMedia('(max-width: 1000px)').matches,
  );
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAuthState();
  const [createLabVisit] = useLabsAnalyticsLabVisitsCreateMutation();
  useNotificationsWebSocket();

  useEffect(() => {
    if (isLoggedIn) void createLabVisit({ labVisitLogCreate: {} }).unwrap()
      .then(() => dispatch(baseApi.util.invalidateTags(['Analytics'])))
      .catch(() => { /* Visit tracking is best-effort; leave analytics cache unchanged on failure. */ });
  }, [isLoggedIn, createLabVisit, dispatch]);

  const { data: meData } = useGetMeQuery(undefined, { skip: !isLoggedIn });
  useEffect(() => {
    if (meData) {
      const user = meData.data;
      const { permissions, permissionGroups } = flattenEffectiveRoles(
        user.effective_roles,
      );
      dispatch(
        meActions.setMe({
          id: user.id,
          username: user.username,
          displayName: user.display_name ?? '',
          avatar: user.avatar_url,
          permissions,
          permissionGroups,
        }),
      );
    }
  }, [meData, dispatch]);

  const layoutClass = useMemo(
    () => (collapsed ? styleCss.layoutCollapsed : styleCss.layout),
    [collapsed],
  );

  const contentClass = useMemo(
    () => `${styles.content} ${styleCss.content}`,
    [styles],
  );

  const handleSetCollapsed = useCallback(
    (value: boolean) => setCollapsed(value),
    [],
  );

  return (
    <Layout className={layoutClass}>
      <OfflineNotification />
      <div className="header__headliner" />
      <AppHeader />
      <AppSideNav collapsed={collapsed} setCollapsed={handleSetCollapsed} />
      <Content className={contentClass}>
        <NotificationBanner />
        <Suspense fallback={<FullscreenLoading />}>
          {" "}
          {/* ← fix blank screen */}
          <Outlet />
        </Suspense>
      </Content>
      <ChatWidget />
    </Layout>
  );
}
