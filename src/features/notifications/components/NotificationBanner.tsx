import { Button, Space } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/store";
import { SystemBanner, type NotificationVariant } from "@/shared/notifications";
import { notificationActions } from "../notificationSlice";

const TYPE_MAP: Record<string, NotificationVariant> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

/** Only follow links that stay inside the app. */
const isInAppPath = (path?: string): path is string =>
  !!path && path.startsWith("/") && !path.startsWith("//");

/** Label for a notification's primary action, by where it leads. */
const actionLabel = (path: string) => (path.startsWith("/booking-calendar") ? "Book now" : "Open");

export function NotificationBanner() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useAppSelector((state) => state.notifications.items);
  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 12,
      }}
    >
      {items.map((item, index) => (
        <SystemBanner
          key={item.id}
          variant={TYPE_MAP[item.message_type ?? "info"] ?? "info"}
          title={item.message}
          description={item.details || undefined}
          dismissible
          onDismiss={() =>
            dispatch(notificationActions.removeNotification(item.id))
          }
          action={
            isInAppPath(item.action_path) || (items.length > 1 && index === 0) ? (
              <Space size={4}>
                {isInAppPath(item.action_path) && (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      dispatch(notificationActions.removeNotification(item.id));
                      navigate(item.action_path as string);
                    }}
                  >
                    {actionLabel(item.action_path)}
                  </Button>
                )}
                {items.length > 1 && index === 0 && (
                  <Button
                    size="small"
                    type="text"
                    onClick={() => dispatch(notificationActions.clearNotifications())}
                  >
                    Dismiss all ({items.length})
                  </Button>
                )}
              </Space>
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
