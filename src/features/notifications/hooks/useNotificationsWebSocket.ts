import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/store';
import { attemptRefreshAccessToken } from '@/shared/lib/api';
import { notify } from '@/shared/notifications';
import { useAuthedWebSocket } from '@/shared/ws/useAuthedWebSocket';
import { getWsBaseUrl } from '@/shared/lib/backendTarget';
import { showDesktopNotification } from '../desktopNotifications';
import { inboxApi } from '../inboxApi';
import { actionLabel, isBannerVisible, mapInboxItem, toBannerVariant } from '../inboxMapper';
import { notificationActions } from '../notificationSlice';
import { hasShownAlert, markAlertShown } from '../shownAlerts';

type NotificationWsMessage = {
  type?: string;
  event?: 'created' | 'updated' | 'removed';
  id?: number;
  message?: string;
  details?: string;
  /** Choice on the wire (`{value, label}`); a bare string is accepted too. */
  message_type?: string | { value: string; label?: string };
  display_mode?: string | { value: string; label?: string };
  is_dismissible?: boolean;
  expiry_date?: string | null;
  expires_at?: string | null;
  action_path?: string;
  is_read?: boolean;
  /** Set on the batch the server replays when the socket connects: list it, don't pop it up again. */
  replay?: boolean;
  created?: string;
};

/**
 * Live notifications over `/ws/user/` (delivers both broadcast and targeted user notifications):
 * - Expiring banners (`display_mode === 'banner'` or legacy `announcement`): rendered strictly in
 *   the sticky top NotificationBanner (created/updated in-place, removed on expiry/delete). Never
 *   triggers a toast popup or desktop notification.
 * - One-time alerts (`display_mode === 'alert'`): refreshes the header bell and shows a toast +
 *   opt-in desktop notification at most once (never on connect replay, already-read, or repeat push).
 */
export function useNotificationsWebSocket(): void {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  const urlFactory = useCallback(
    (token: string) => `${getWsBaseUrl()}/ws/user/?token=${encodeURIComponent(token)}`,
    [],
  );

  const refreshInbox = useCallback(() => {
    // The connect replay sends a burst; refresh the bell once for it.
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      dispatch(
        inboxApi.util.invalidateTags([
          { type: 'Notification', id: 'LIST' },
          { type: 'Notification', id: 'COUNT' },
        ]),
      );
    }, 400);
  }, [dispatch]);

  const handleMessage = useCallback(
    (message: NotificationWsMessage) => {
      if (message.type !== 'notification' || !message.id) {
        return;
      }

      if (message.event === 'removed') {
        dispatch(notificationActions.removeNotification(message.id));
        refreshInbox();
        return;
      }

      if (!message.message) {
        return;
      }

      refreshInbox();
      const item = mapInboxItem({ ...message, id: message.id });

      // Expiring banners NEVER trigger toast alerts or desktop popups.
      if (item.displayMode === 'banner') {
        if (isBannerVisible(item)) {
          dispatch(
            notificationActions.upsertBanner({
              id: item.id,
              type: 'notification',
              message: item.title,
              details: item.details,
              message_type: item.kind,
              is_dismissible: item.isDismissible,
              expires_at: item.expiresAt,
              action_path: item.actionPath ?? undefined,
              created: item.createdAt,
            }),
          );
        } else {
          dispatch(notificationActions.removeNotification(item.id));
        }
        return;
      }

      // One-time alerts: never pop up on connect replay, already-read items, or duplicate deliveries.
      if (message.replay || item.isRead || hasShownAlert(item.id)) {
        return;
      }
      markAlertShown(item.id);

      const open = () => {
        dispatch(inboxApi.endpoints.markNotificationRead.initiate(item.id) as never);
        if (item.actionPath) navigate(item.actionPath);
      };

      const variant = toBannerVariant(item.kind);
      notify[variant](item.title, {
        key: `notification-${item.id}`,
        description: item.details || undefined,
        duration: item.actionPath ? 10_000 : 6_000,
        action: item.actionPath ? { label: actionLabel(item.actionPath), onClick: open } : undefined,
      });

      showDesktopNotification(
        {
          id: item.id,
          title: item.title,
          body: item.details,
          actionLabel: item.actionPath ? actionLabel(item.actionPath) : undefined,
          // Booking starts and free slots are time-sensitive: they stay until clicked or closed.
          urgent: !!item.actionPath && /^\/(booking-calendar|my-bookings)/.test(item.actionPath),
        },
        open,
      );
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
