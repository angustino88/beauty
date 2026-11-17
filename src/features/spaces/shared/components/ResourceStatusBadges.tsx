import { Tooltip } from "antd";
import { Ban, CalendarCheck2, CircleCheck, CircleDashed, Clock3, Lock, UserRound, Wrench } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import {
  LIFECYCLE_STATUS_LABELS,
  resourceActivityMarker,
  type Availability,
  type Choice,
  type ActivityStatus,
  type Condition,
  type LifecycleStatus,
  type ResourceState,
} from "../resourceStatus";
import type { StatusTone } from "@/shared/status/statusTone";

/*
 * The three independent states of a room, station or bench, each from its own API field and each
 * with its own colour rule. They are never merged into one badge (AGENTS.md rule 2):
 *   lifecycle_status  where the resource is in its life: planned → in service → retired
 *   availability      can it be used now (condition and parent downtime decide it)
 *   activity_status   what bookings are doing with it today
 */

const ICON_SIZE = 12;

const LIFECYCLE: Record<LifecycleStatus, { tone: StatusTone; icon: React.ReactNode; hint: string }> = {
  planned: { tone: "info", icon: <Clock3 size={ICON_SIZE} />, hint: "Registered but not commissioned yet." },
  in_service: { tone: "success", icon: <CircleCheck size={ICON_SIZE} />, hint: "Commissioned and part of the lab." },
  retired: { tone: "neutral", icon: <Ban size={ICON_SIZE} />, hint: "Decommissioned; kept for history only." },
};

export function LifecycleBadge({ value }: { value?: Choice<LifecycleStatus> | null }) {
  if (!value) return <StatusBadge tone="neutral" label="Unknown" />;
  const spec = LIFECYCLE[value.value] ?? { tone: "neutral" as const, icon: null, hint: "" };
  const label = LIFECYCLE_STATUS_LABELS[value.value] ?? value.label;
  // In service is the normal state: quiet text, so the coloured Availability pill beside it carries
  // the signal. Planned and retired are exceptions and keep a pill.
  if (value.value === "in_service") {
    return (
      <Tooltip title={spec.hint}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--lm-text-secondary)", fontSize: 12.5 }}>
          <CircleCheck size={ICON_SIZE} style={{ color: "var(--lm-text-tertiary)" }} aria-hidden="true" />
          {label}
        </span>
      </Tooltip>
    );
  }
  return (
    <Tooltip title={spec.hint || undefined}>
      <span><StatusBadge tone={spec.tone} label={label} icon={spec.icon} /></span>
    </Tooltip>
  );
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Available, or why not: its own condition first, then a parent space that blocks it. */
export function AvailabilityBadge({ state }: { state: Partial<ResourceState> }) {
  const lifecycle = state.lifecycle_status?.value;
  const condition: Condition | undefined = state.condition?.value;
  const availability: Availability | undefined = state.availability;

  if (lifecycle === "retired" || lifecycle === "planned") {
    return <StatusBadge tone="neutral" label="Not in service" icon={<CircleDashed size={ICON_SIZE} />} title="Only in-service resources can be used." />;
  }
  if (condition === "out_of_service") {
    return <StatusBadge tone="danger" label="Out of service" icon={<Ban size={ICON_SIZE} />} title="Unavailable: out of service until repaired." />;
  }
  if (condition === "in_maintenance") {
    return <StatusBadge tone="warning" label="In maintenance" icon={<Wrench size={ICON_SIZE} />} title="Unavailable: being serviced." />;
  }
  if (availability?.value === "unavailable") {
    const blocker = availability.blocked_by;
    const reason = availability.reason ? availability.reason.replaceAll("_", " ") : null;
    const title = blocker
      ? `Unavailable: ${blocker.type} ${blocker.name} is ${reason ?? "unavailable"}.`
      : `Unavailable${reason ? `: ${reason}` : ""}.`;
    return (
      <StatusBadge
        tone="warning"
        label={blocker ? `Blocked by ${blocker.type}` : "Unavailable"}
        icon={<Lock size={ICON_SIZE} />}
        title={capitalise(title)}
      />
    );
  }
  return <StatusBadge tone="success" label="Available" icon={<CircleCheck size={ICON_SIZE} />} title="Can be booked and used." />;
}

/** Booking activity today. Idle is quiet text, so busy rows stand out. */
export function ActivityBadge({ value }: { value?: Choice<ActivityStatus> | null }) {
  const marker = resourceActivityMarker(value ? { activity_status: value } : null);
  if (!marker) return <span style={{ color: "var(--lm-text-tertiary)", fontSize: 12 }}>No booking today</span>;
  const icon = marker.value === "active" ? <UserRound size={ICON_SIZE} /> : <CalendarCheck2 size={ICON_SIZE} />;
  const label = marker.value === "active" ? "In use now" : "Booked";
  return <StatusBadge tone={marker.tone} label={label} icon={icon} title={marker.description} />;
}
