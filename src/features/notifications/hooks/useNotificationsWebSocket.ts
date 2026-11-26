import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/store";
import { attemptRefreshAccessToken } from "@/shared/lib/api";
import { useAuthedWebSocket } from "@/shared/ws/useAuthedWebSocket";
import { notificationActions } from "../notificationSlice";
import { getWsBaseUrl } from "@/shared/lib/backendTarget";

type NotificationWsMessage = {
  type?: string;
  id?: number;
  message?: string;
  details?: string;
  /** Choice on the wire (`{value, label}`); a bare string is accepted too. */
  message_type?: string | { value: string; label?: string };
  action_path?: string;
  created?: string;
};

export function useNotificationsWebSocket(): void {
  const dispatch = useDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const urlFactory = useCallback(
    (token: string) =>
      `${getWsBaseUrl()}/ws/notifications/?token=${encodeURIComponent(token)}`,
    [],
  );

  const handleMessage = useCallback(
    (message: NotificationWsMessage) => {
      if (message.type !== "notification" || !message.id || !message.message) {
        return;
      }
      dispatch(
        notificationActions.pushNotification({
          id: message.id,
          type: message.type,
          message: message.message,
          details: message.details,
          message_type: typeof message.message_type === 'string' ? message.message_type : message.message_type?.value,
          action_path: message.action_path || undefined,
          created: message.created,
        }),
      );
    },
    [dispatch],
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
