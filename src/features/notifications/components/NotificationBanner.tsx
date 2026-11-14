import { Alert } from "antd";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/store";
import { notificationActions } from "../notificationSlice";

const TYPE_MAP: Record<string, "info" | "success" | "warning" | "error"> = {
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
    <div style={{ position: "sticky", top: 0, zIndex: 999, width: "100%" }}>
      {items.map((item) => (
        <Alert
          key={item.id}
          closable
          showIcon
          message={item.message}
          description={item.details || undefined}
          type={TYPE_MAP[item.message_type ?? "info"] ?? "info"}
          style={{ marginBottom: 4 }}
          onClose={() =>
            dispatch(notificationActions.removeNotification(item.id))
          }
        />
      ))}
    </div>
  );
}
