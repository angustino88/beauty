import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/app/store';
import { SystemBanner } from '@/shared/notifications';
import { useGetActiveBannersQuery, useMarkNotificationReadMutation } from '../inboxApi';
import { isBannerVisible, toBannerVariant } from '../inboxMapper';
import { notificationActions } from '../notificationSlice';
import styles from './NotificationBanner.module.css';

const MAX_COLLAPSED_BANNERS = 2;

export function NotificationBanner() {
  const dispatch = useDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const items = useAppSelector((state) => state.notifications.items);
  const [expanded, setExpanded] = useState(false);

  const { data: fetchedBanners } = useGetActiveBannersQuery(undefined, {
    skip: !accessToken,
  });
  const [markRead] = useMarkNotificationReadMutation();

  // Hydrate active banners from REST so banners appear immediately even before WS connects.
  useEffect(() => {
    if (!fetchedBanners) return;
    const nowMs = Date.now();
    dispatch(
      notificationActions.hydrateBanners(
        fetchedBanners
          .filter((item) => isBannerVisible(item, nowMs))
          .map((item) => ({
            id: item.id,
            type: 'notification',
            message: item.title,
            details: item.details,
            message_type: item.kind,
            is_dismissible: item.isDismissible,
            expires_at: item.expiresAt,
            created: item.createdAt,
          })),
      ),
    );
  }, [fetchedBanners, dispatch]);

  // Auto-prune expired banners the moment their earliest expires_at passes.
  useEffect(() => {
    const nowMs = Date.now();
    let earliestMs = Infinity;
    for (const item of items) {
      if (!item.expires_at) continue;
      const ms = Date.parse(item.expires_at);
      if (!Number.isNaN(ms) && ms < earliestMs) {
        earliestMs = ms;
      }
    }
    if (!Number.isFinite(earliestMs)) return;

    const delayMs = Math.max(0, earliestMs - nowMs);
    // Guard against 32-bit setTimeout overflow (~24.8 days).
    const boundedDelay = Math.min(delayMs, 2_000_000_000);
    const timer = setTimeout(() => {
      dispatch(notificationActions.pruneExpiredBanners(Date.now()));
    }, boundedDelay + 50);

    return () => clearTimeout(timer);
  }, [items, dispatch]);

  if (items.length === 0) return null;

  const dismiss = (id: number) => {
    dispatch(notificationActions.removeNotification(id));
    void markRead(id);
  };

  const dismissibleItems = items.filter((entry) => entry.is_dismissible);
  const dismissAll = () => {
    dismissibleItems.forEach((entry) => void markRead(entry.id));
    dispatch(notificationActions.clearDismissibleBanners());
  };

  const visibleItems = expanded ? items : items.slice(0, MAX_COLLAPSED_BANNERS);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div className={styles.stack} role="region" aria-label="System announcements">
      {visibleItems.map((item, index) => {
        const showInlineDismissAll =
          !hiddenCount && !expanded && dismissibleItems.length > 1 && index === 0;

        return (
          <SystemBanner
            key={item.id}
            variant={toBannerVariant(item.message_type)}
            title={item.message}
            description={item.details || undefined}
            dismissible={item.is_dismissible}
            onDismiss={item.is_dismissible ? () => dismiss(item.id) : undefined}
            action={
              showInlineDismissAll ? (
                <Button size="small" type="text" onClick={dismissAll}>
                  Dismiss all ({dismissibleItems.length})
                </Button>
              ) : undefined
            }
          />
        );
      })}

      {(hiddenCount > 0 || (expanded && items.length > MAX_COLLAPSED_BANNERS)) && (
        <div className={styles.overflowBar}>
          <span>
            {hiddenCount > 0
              ? `${hiddenCount} more active ${hiddenCount === 1 ? 'banner' : 'banners'}`
              : `Showing all ${items.length} active banners`}
          </span>
          <span className={styles.overflowActions}>
            <Button size="small" type="link" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? 'Show fewer' : `Show all (${items.length})`}
            </Button>
            {dismissibleItems.length > 1 && (
              <Button size="small" type="text" onClick={dismissAll}>
                Dismiss all ({dismissibleItems.length})
              </Button>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
