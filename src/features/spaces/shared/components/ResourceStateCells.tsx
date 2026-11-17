import { LockOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { StatusBadge } from "@/shared/components/StatusBadge";
import type { Choice, AccessPolicy, ResourceState } from "../resourceStatus";
import type { StateView } from "../resourceStatusViews";
import styles from "./ResourceStateCells.module.css";

/** The standard status pill (same as equipment, license and the overview tiles) with its reason on hover. */
export function StateBadge({ view }: { view: StateView }) {
  return (
    <Tooltip title={view.detail} placement="topLeft">
      <span className={styles.anchor}>
        <StatusBadge tone={view.tone} label={view.label} title="" />
      </span>
    </Tooltip>
  );
}

/** Availability pill plus the restricted-access lock rooms and stations already showed. */
export function AvailabilityBadge({ view, state }: { view: StateView; state: Partial<ResourceState> & { access_policy?: Choice<AccessPolicy> | null } }) {
  const restricted = state.access_policy?.value === "restricted";
  return (
    <span className={styles.withLock}>
      <StateBadge view={view} />
      {restricted && (
        <Tooltip title="Restricted access: only allowed users can book it.">
          <LockOutlined className={styles.lock} aria-label="Restricted access" />
        </Tooltip>
      )}
    </span>
  );
}
