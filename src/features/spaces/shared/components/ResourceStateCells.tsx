import { LockOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { StatusBadge } from "@/shared/components/StatusBadge";
import type { AccessPolicy, Choice } from "../resourceStatus";
import type { StateView } from "../resourceStatusViews";
import styles from "./ResourceStateCells.module.css";

/** Every state (lifecycle, availability, activity) uses the standard status badge, with its reason on hover. */
export function StateBadge({ view }: { view: StateView }) {
  return (
    <Tooltip title={view.detail} placement="topLeft">
      <span className={styles.anchor}>
        <StatusBadge tone={view.tone} label={view.label} title="" />
      </span>
    </Tooltip>
  );
}

/** Availability badge, plus the restricted-access lock of rooms and stations. */
export function AvailabilityBadge({ view, accessPolicy }: { view: StateView; accessPolicy?: Choice<AccessPolicy> | null }) {
  return (
    <span className={styles.withLock}>
      <StateBadge view={view} />
      {accessPolicy?.value === "restricted" && (
        <Tooltip title="Restricted access: only allowed users can book it.">
          <LockOutlined className={styles.lock} aria-label="Restricted access" />
        </Tooltip>
      )}
    </span>
  );
}
