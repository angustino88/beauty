import {
  BellOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DesktopOutlined,
  ExclamationCircleFilled,
  InfoCircleFilled,
  SoundFilled,
} from '@ant-design/icons';
import { Button, Drawer, Grid, Popover, Segmented, Skeleton, Switch, Tooltip } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notify } from '@/shared/notifications';
import { useDesktopNotifications } from '../desktopNotifications';
import {
  useGetInboxQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../inboxApi';
import {
  actionLabel,
  badgeLabel,
  formatRelative,
  type InboxItem,
  type InboxKind,
} from '../inboxMapper';
import styles from './NotificationBell.module.css';

const ICONS: Record<InboxKind, React.ReactNode> = {
  success: <CheckCircleFilled />,
  info: <InfoCircleFilled />,
  warning: <ExclamationCircleFilled />,
  error: <CloseCircleFilled />,
  announcement: <SoundFilled />,
};

function NotificationRow({ item, onOpen }: { item: InboxItem; onOpen: (item: InboxItem) => void }) {
  const isBanner = item.displayMode === 'banner';
  const showUnread = !isBanner && !item.isRead;

  return (
    <li>
      <button
        type="button"
        className={styles.item}
        data-unread={showUnread}
        onClick={() => onOpen(item)}
        aria-label={`${showUnread ? 'Unread: ' : ''}${isBanner ? 'Banner: ' : ''}${item.title}`}
      >
        <span className={styles.itemIcon} data-kind={item.kind} aria-hidden>
          {ICONS[item.kind]}
        </span>
        <span className={styles.itemBody}>
          <span className={styles.itemTitleRow}>
            <span className={styles.itemTitle}>{item.title}</span>
            {isBanner && <span className={styles.bannerTag}>Banner</span>}
          </span>
          {item.details && <span className={styles.itemDetails}>{item.details}</span>}
          <span className={styles.itemMeta}>
            <time dateTime={item.createdAt}>{formatRelative(item.createdAt)}</time>
            {!isBanner && item.actionPath && (
              <span className={styles.itemAction}>{actionLabel(item.actionPath)} →</span>
            )}
          </span>
        </span>
        {showUnread && <span className={styles.unreadDot} aria-hidden />}
      </button>
    </li>
  );
}

function DesktopToggle() {
  const { permission, enabled, enable, disable } = useDesktopNotifications();
  if (permission === 'unsupported') return null;
  const blocked = permission === 'denied';
  return (
    <div className={styles.footer}>
      <DesktopOutlined className={styles.footerIcon} aria-hidden />
      <div className={styles.footerText}>
        <span className={styles.footerTitle}>Desktop notifications</span>
        <span className={styles.footerHint}>
          {blocked
            ? 'Blocked by your browser. Allow notifications for this site in the browser settings.'
            : 'Get alerts on your computer while Lab Mango is in the background.'}
        </span>
      </div>
      <Switch
        size="small"
        checked={enabled}
        disabled={blocked}
        aria-label="Desktop notifications"
        onChange={async (on) => {
          if (!on) return disable();
          await enable();
          if (Notification.permission === 'granted') notify.success('Desktop notifications are on');
        }}
      />
    </div>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data: items, isLoading } = useGetInboxQuery(filter === 'unread' ? { unread: true } : undefined);
  const { data: unread = 0 } = useGetUnreadCountQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  const open = (item: InboxItem) => {
    if (item.displayMode === 'alert' && !item.isRead) void markRead(item.id);
    if (item.actionPath) {
      onClose();
      navigate(item.actionPath);
    }
  };

  return (
    <div className={styles.panel} role="dialog" aria-label="Notifications">
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Notifications</h2>
        <Button type="link" size="small" disabled={unread === 0} loading={markingAll} onClick={() => void markAllRead()}>
          Mark all as read
        </Button>
      </div>
      <div className={styles.tabs}>
        <Segmented
          size="small"
          block
          value={filter}
          onChange={(value) => setFilter(value as 'all' | 'unread')}
          options={[
            { label: 'All', value: 'all' },
            { label: unread ? `Unread (${badgeLabel(unread)})` : 'Unread', value: 'unread' },
          ]}
        />
      </div>
      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.loading}>
            <Skeleton active avatar paragraph={{ rows: 1 }} />
            <Skeleton active avatar paragraph={{ rows: 1 }} />
          </div>
        ) : items?.length ? (
          <ul className={styles.items}>
            {items.map((item) => (
              <NotificationRow key={item.id} item={item} onOpen={open} />
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <BellOutlined className={styles.emptyIcon} aria-hidden />
            <strong>{filter === 'unread' ? "You're all caught up" : 'No notifications yet'}</strong>
            <span>Slot alerts, booking updates and lab announcements appear here.</span>
          </div>
        )}
      </div>
      <DesktopToggle />
    </div>
  );
}

/** Header bell: unread badge and the notification panel (a bottom sheet on phones). */
export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const isPhone = screens.sm === false;
  const { data: unread = 0 } = useGetUnreadCountQuery(undefined, { pollingInterval: 120_000 });
  const badge = badgeLabel(unread);
  const label = badge ? `Notifications, ${unread} unread` : 'Notifications';

  const trigger = (
    <Tooltip title={open ? undefined : 'Notifications'}>
      <button
        type="button"
        className={`${className ?? ''} ${styles.bell}`}
        aria-label={label}
        aria-haspopup="dialog"
        onClick={isPhone ? () => setOpen(true) : undefined}
      >
        <BellOutlined />
        {badge && (
          <span className={styles.badge} aria-hidden>
            {badge}
          </span>
        )}
      </button>
    </Tooltip>
  );

  if (isPhone) {
    return (
      <>
        {trigger}
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          placement="bottom"
          size="80vh"
          closable={false}
          destroyOnHidden
          styles={{ body: { padding: 0 } }}
          className={styles.sheet}
        >
          <NotificationPanel onClose={() => setOpen(false)} />
        </Drawer>
      </>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      destroyOnHidden
      styles={{ container: { padding: 0 } }}
      content={<NotificationPanel onClose={() => setOpen(false)} />}
    >
      {trigger}
    </Popover>
  );
}

export default NotificationBell;
