import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/store";
import { attemptRefreshAccessToken } from "@/shared/lib/api";
import { notify } from "@/shared/notifications";
import { useAuthedWebSocket } from "@/shared/ws/useAuthedWebSocket";
import { getWsBaseUrl } from "@/shared/lib/backendTarget";
import { showDesktopNotification } from "../desktopNotifications";
import { inboxApi } from "../inboxApi";
import { actionLabel, mapInboxItem } from "../inboxMapper";
import { notificationActions } from "../notificationSlice";

type NotificationWsMessage = {
  type?: string;
  id?: number;
  message?: string;
  details?: string;
  /** Choice on the wire (`{value, label}`); a bare string is accepted too. */
  message_type?: string | { value: string; label?: string };
  action_path?: string;
  is_read?: boolean;
  /** Set on the batch the server replays when the socket connects: list it, don't pop it up again. */
  replay?: boolean;
  created?: string;
};

/**
 * Live notifications:
 * - every message refreshes the header bell (badge + panel);
 * - a new one shows a short toast with its action (e.g. Book now), and a desktop notification
 *   when the user opted in and Lab Mango is in the background;
 * - unread lab announcements stay pinned in the banner until dismissed (which marks them read).
 */
export function useNotificationsWebSocket(): void {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);

  const urlFactory = useCallback(
    (token: string) =>
      `${getWsBaseUrl()}/ws/notifications/?token=${encodeURIComponent(token)}`,
    [],
  );

  const refreshInbox = useCallback(() => {
    // The connect replay sends a burst; refresh the bell once for it.
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      dispatch(
        inboxApi.util.invalidateTags([
          { type: "Notification", id: "LIST" },
          { type: "Notification", id: "COUNT" },
        ]),
      );
    }, 400);
  }, [dispatch]);

  const handleMessage = useCallback(
    (message: NotificationWsMessage) => {
      if (message.type !== "notification" || !message.id || !message.message) {
        return;
      }
      refreshInbox();
      const item = mapInboxItem({ ...message, id: message.id });

      if (item.kind === "announcement") {
        if (!item.isRead) {
          dispatch(
            notificationActions.pushNotification({
              id: item.id,
              type: "notification",
              message: item.title,
              details: item.details,
              message_type: item.kind,
              action_path: item.actionPath ?? undefined,
              created: item.createdAt,
            }),
          );
        }
        return;
      }
      if (message.replay || item.isRead) return;

      const open = () => {
        dispatch(inboxApi.endpoints.markNotificationRead.initiate(item.id) as never);
        if (item.actionPath) navigate(item.actionPath);
      };
      notify[item.kind === "error" ? "error" : item.kind === "warning" ? "warning" : item.kind === "success" ? "success" : "info"](
        item.title,
        {
          key: `notification-${item.id}`,
          description: item.details || undefined,
          duration: item.actionPath ? 10_000 : 6_000,
          action: item.actionPath ? { label: actionLabel(item.actionPath), onClick: open } : undefined,
        },
      );
      showDesktopNotification({ id: item.id, title: item.title, body: item.details }, open);
    },
    [dispatch, navigate, refreshInbox],
  );

  const handleUnauthorized = useCallback(async () => {
    const token = await attemptRefreshAccessToken(
      dispatch as (action: { type: string; payload?: string }) => void,
    );
    return Boolean(token);
  }, [dispatch]);

  useAuthedWebSocket({
    enabled: Boolean(accessToken),
    urlFactory,
    onMessage: handleMessage,
    onUnauthorized: handleUnauthorized,
  });
}
