import { useMsal } from "@azure/msal-react";
import { Layout } from "antd";
import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import AppSideNav from "./AppSideNav";
import styleCss from "./layout.module.css";
import { OfflineNotification } from "./OfflineNotification";
import { useGetMeQuery } from "@/features/auth/api";
import { meActions, meFromUser } from "@/features/auth/meSlice";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { resolveUserDisplayName } from "@/features/auth/utils/displayName";
import { ChatWidget } from "@/features/chat-widget";
import { useNotificationsWebSocket } from "@/features/notifications/hooks/useNotificationsWebSocket";
import { useAppDispatch } from "@/app/store";
import { NotificationBanner } from "@/features/notifications/components/NotificationBanner";
import { FullscreenLoading } from "./FullscreenLoading";
import { useLabsAnalyticsLabVisitsCreateMutation } from "@/shared/api/generated/api";
import { baseApi } from "@/shared/lib/api";

const { Content } = Layout;

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(
    () => window.matchMedia('(max-width: 1000px)').matches,
  );
  const dispatch = useAppDispatch();
  const { instance, accounts } = useMsal();
  const { isLoggedIn } = useAuthState();
  const [createLabVisit] = useLabsAnalyticsLabVisitsCreateMutation();
  useNotificationsWebSocket();

  // React StrictMode runs effects twice in development; the ref keeps it to one visit per login.
  const visitLoggedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) {
      visitLoggedRef.current = false;
      return;
    }
    if (visitLoggedRef.current) return;
    visitLoggedRef.current = true;
    void createLabVisit({ labVisitLogCreate: {} }).unwrap()
      .then(() => dispatch(baseApi.util.invalidateTags(['Analytics'])))
      .catch(() => { /* Visit tracking is best-effort; leave analytics cache unchanged on failure. */ });
  }, [isLoggedIn, createLabVisit, dispatch]);

  const { data: meData } = useGetMeQuery(undefined, { skip: !isLoggedIn });
  useEffect(() => {
    if (meData) {
      const user = meData.data;
      const msalAccount = instance.getActiveAccount() ?? accounts[0];
      dispatch(
        meActions.setMe({
          ...meFromUser(user),
          displayName: resolveUserDisplayName(user.display_name, user.username, msalAccount?.name),
        }),
      );
    }
  }, [meData, dispatch, instance, accounts]);

  return (
    <Layout className={collapsed ? styleCss.layoutCollapsed : styleCss.layout}>
      <OfflineNotification />
      <div className="header__headliner" />
      <AppHeader />
      <AppSideNav collapsed={collapsed} setCollapsed={setCollapsed} />
      <Content className={styleCss.content}>
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
