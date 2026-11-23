import { Button } from "antd";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/store";
import { SystemBanner, type NotificationVariant } from "@/shared/notifications";
import { notificationActions } from "../notificationSlice";

const TYPE_MAP: Record<string, NotificationVariant> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

export function NotificationBanner() {
  const dispatch = useDispatch();
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
            items.length > 1 && index === 0 ? (
              <Button
                size="small"
                type="text"
                onClick={() => dispatch(notificationActions.clearNotifications())}
              >
                Dismiss all ({items.length})
              </Button>
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
