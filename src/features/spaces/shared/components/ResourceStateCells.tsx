import { Tooltip } from "antd";
import { StatusBadge } from "@/shared/components/StatusBadge";
import type { ResourceState } from "../resourceStatus";
import { activityView, availabilityView, lifecycleView } from "./resourceStatusViews";
import styles from "./ResourceStateCells.module.css";

/*
 * One cell per state column. All three use the shared views (resourceStatusViews), so labels,
 * colours and explanations match everywhere. Hover gives the reason in one sentence.
 *
 * Emphasis follows what needs attention: availability is always a coloured pill; activity is a
 * pill only when there is a booking; lifecycle is quiet text while in service and a pill when
 * planned or retired.
 */

type State = Partial<ResourceState>;

export function AvailabilityCell({ state }: { state: State }) {
  const view = availabilityView(state);
  return (
    <Tooltip title={view.detail} placement="topLeft">
      <span className={styles.anchor}>
        <StatusBadge tone={view.tone} label={view.label} icon={view.icon} title="" />
      </span>
    </Tooltip>
  );
}

export function ActivityCell({ state }: { state: State }) {
  const view = activityView(state);
  if (!view) return <span className={styles.quiet}>No booking today</span>;
  return (
    <Tooltip title={view.detail} placement="topLeft">
      <span className={styles.anchor}>
        <StatusBadge tone={view.tone} label={view.label} icon={view.icon} title="" />
      </span>
    </Tooltip>
  );
}

export function LifecycleCell({ state }: { state: State }) {
  const view = lifecycleView(state);
  const quiet = state.lifecycle_status?.value === "in_service";
  return (
    <Tooltip title={view.detail} placement="topLeft">
      <span className={styles.anchor}>
        {quiet ? (
          <span className={styles.quiet}>
            {view.icon}
            {view.label}
          </span>
        ) : (
          <StatusBadge tone={view.tone} label={view.label} icon={view.icon} title="" />
        )}
      </span>
    </Tooltip>
  );
}
