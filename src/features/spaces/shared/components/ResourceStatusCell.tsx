import { Popover } from "antd";
import { StatusBadge } from "@/shared/components/StatusBadge";
import type { ResourceState } from "../resourceStatus";
import { activityView, availabilityView, lifecycleView, type StateView } from "./resourceStatusViews";
import styles from "./ResourceStatusCell.module.css";

function StateRow({ title, view }: { title: string; view: StateView | null }) {
  return (
    <div className={styles.row}>
      <dt>{title}</dt>
      <dd>
        {view ? (
          <>
            <span className={`${styles.rowLabel} ${styles[view.tone]}`}>{view.icon}{view.label}</span>
            <span className={styles.rowDetail}>{view.detail}</span>
          </>
        ) : (
          <span className={styles.rowDetail}>No booking today.</span>
        )}
      </dd>
    </div>
  );
}

/**
 * One cell for all three states. The pill answers "can I use it now?" (availability); a small
 * marker beside it shows booking activity only when there is some; the line underneath is the
 * lifecycle, quiet while in service. Hovering shows all three with their reasons.
 */
export function ResourceStatusCell({ state }: { state: Partial<ResourceState> }) {
  const lifecycle = lifecycleView(state);
  const availability = availabilityView(state);
  const activity = activityView(state);
  const lifecycleQuiet = state.lifecycle_status?.value === "in_service";

  const card = (
    <dl className={styles.card} aria-label="Status details">
      <StateRow title="Availability" view={availability} />
      <StateRow title="Activity" view={activity} />
      <StateRow title="Lifecycle" view={lifecycle} />
    </dl>
  );

  return (
    <Popover content={card} placement="right" mouseEnterDelay={0.25} arrow={false}>
      <div className={styles.cell} tabIndex={0} aria-label={`${availability.label}${activity ? `, ${activity.label.toLowerCase()}` : ""}, ${lifecycle.label.toLowerCase()}`}>
        <div className={styles.line}>
          <StatusBadge tone={availability.tone} label={availability.label} icon={availability.icon} title="" />
          {activity && (
            <span className={`${styles.marker} ${styles[activity.tone]}`}>
              {activity.icon}
              {activity.label}
            </span>
          )}
        </div>
        <span className={`${styles.lifecycle} ${lifecycleQuiet ? "" : styles[lifecycle.tone]}`}>
          {lifecycle.icon}
          {lifecycle.label}
        </span>
      </div>
    </Popover>
  );
}

