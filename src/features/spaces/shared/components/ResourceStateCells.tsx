import { LockOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { StatusBadge } from "@/shared/components/StatusBadge";
import type { AccessPolicy, Choice } from "../resourceStatus";
import type { StateView } from "../resourceStatusViews";
import styles from "./ResourceStateCells.module.css";

/*
 * Visual hierarchy for the three state columns: the lifecycle is the row's status and the only
 * filled pill; availability and activity are secondary signals drawn as a dot and text, which
 * only take colour when they need attention. One pill per row, so the columns read as a list,
 * not a grid of badges.
 */

/** Main status: the standard filled pill (same as equipment, licenses and the overview tiles). */
export function MainStateBadge({ view }: { view: StateView }) {
  return (
    <Tooltip title={view.detail} placement="topLeft">
      <span className={styles.anchor}>
        <StatusBadge tone={view.tone} label={view.label} title="" />
      </span>
    </Tooltip>
  );
}

/**
 * Secondary state: coloured dot plus text. Normal states (available, booked, in use) keep
 * secondary text colour; problems (warning, danger) colour the text so they stand out.
 * `empty` renders a quiet dash instead (nothing to report), with the reason still on hover.
 */
export function StateText({ view, empty = false }: { view: StateView; empty?: boolean }) {
  if (empty) {
    return (
      <Tooltip title={view.detail} placement="topLeft">
        <span className={styles.empty} aria-label={view.label}>—</span>
      </Tooltip>
    );
  }
  const alert = view.tone === "warning" || view.tone === "danger";
  return (
    <Tooltip title={view.detail} placement="topLeft">
      <span className={`${styles.text} ${styles[view.tone]} ${alert ? styles.alert : ""}`}>
        <span className={styles.dot} aria-hidden="true" />
        {view.label}
      </span>
    </Tooltip>
  );
}

/** Availability as secondary text, plus the restricted-access lock of rooms and stations. */
export function AvailabilityText({ view, accessPolicy }: { view: StateView; accessPolicy?: Choice<AccessPolicy> | null }) {
  return (
    <span className={styles.withLock}>
      <StateText view={view} />
      {accessPolicy?.value === "restricted" && (
        <Tooltip title="Restricted access: only allowed users can book it.">
          <LockOutlined className={styles.lock} aria-label="Restricted access" />
        </Tooltip>
      )}
    </span>
  );
}
