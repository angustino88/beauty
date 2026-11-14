import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/store";
import { attemptRefreshAccessToken } from "@/shared/lib/api";
import { useAuthedWebSocket } from "@/shared/ws/useAuthedWebSocket";
import { notificationActions } from "../notificationSlice";

type NotificationWsMessage = {
  type?: string;
  id?: number;
  message?: string;
  details?: string;
  message_type?: string;
  created?: string;
};

export function useNotificationsWebSocket(): void {
  const dispatch = useDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const wsBase = useMemo(
    () => (import.meta.env.VITE_API_URL as string).replace(/^http/, "ws"),
    [],
  );

  const urlFactory = useCallback(
    (token: string) =>
      `${wsBase}/ws/notifications/?token=${encodeURIComponent(token)}`,
    [wsBase],
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
          message_type: message.message_type,
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
