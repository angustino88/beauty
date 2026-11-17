import type { ReactNode } from "react";
import { Ban, CalendarCheck2, CircleCheck, CircleDashed, Clock3, Lock, UserRound, Wrench } from "lucide-react";
import { LIFECYCLE_STATUS_LABELS, type ResourceState } from "../resourceStatus";
import type { StatusTone } from "@/shared/status/statusTone";

/*
 * The three independent states of a room, station or bench, each from its own API field and each
 * with its own colour rule. They are shown together but never merged into one value (AGENTS.md rule 2):
 *   lifecycle_status  where the resource is in its life: planned → in service → retired
 *   availability      can it be used now (condition and parent downtime decide it)
 *   activity_status   what bookings are doing with it today
 */

const ICON_SIZE = 12;

export interface StateView {
  label: string;
  tone: StatusTone;
  icon: ReactNode;
  /** One sentence for the hover card. */
  detail: string;
}

export function lifecycleView(state: Partial<ResourceState>): StateView {
  switch (state.lifecycle_status?.value) {
    case "planned":
      return { label: LIFECYCLE_STATUS_LABELS.planned, tone: "info", icon: <Clock3 size={ICON_SIZE} />, detail: "Registered but not commissioned yet." };
    case "in_service":
      return { label: LIFECYCLE_STATUS_LABELS.in_service, tone: "success", icon: <CircleCheck size={ICON_SIZE} />, detail: "Commissioned and part of the lab." };
    case "retired":
      return { label: LIFECYCLE_STATUS_LABELS.retired, tone: "neutral", icon: <Ban size={ICON_SIZE} />, detail: "Decommissioned; kept for history only." };
    default:
      return { label: "Unknown", tone: "neutral", icon: <CircleDashed size={ICON_SIZE} />, detail: "No lifecycle recorded." };
  }
}

/** Available, or why not: its own condition first, then a parent space that blocks it. */
export function availabilityView(state: Partial<ResourceState>): StateView {
  const lifecycle = state.lifecycle_status?.value;
  const availability = state.availability;
  if (lifecycle === "retired" || lifecycle === "planned") {
    return { label: "Not in service", tone: "neutral", icon: <CircleDashed size={ICON_SIZE} />, detail: "Only in-service resources can be used or booked." };
  }
  if (state.condition?.value === "out_of_service") {
    return { label: "Out of service", tone: "danger", icon: <Ban size={ICON_SIZE} />, detail: "Not usable until it is repaired." };
  }
  if (state.condition?.value === "in_maintenance") {
    return { label: "In maintenance", tone: "warning", icon: <Wrench size={ICON_SIZE} />, detail: "Temporarily unavailable while it is serviced." };
  }
  if (availability?.value === "unavailable") {
    const blocker = availability.blocked_by;
    const reason = availability.reason ? availability.reason.replaceAll("_", " ") : "unavailable";
    return {
      label: blocker ? `Blocked by ${blocker.type}` : "Unavailable",
      tone: "warning",
      icon: <Lock size={ICON_SIZE} />,
      detail: blocker ? `Its ${blocker.type} ${blocker.name} is ${reason}.` : `Unavailable (${reason}).`,
    };
  }
  return { label: "Available", tone: "success", icon: <CircleCheck size={ICON_SIZE} />, detail: "Can be booked and used." };
}

/** Booking activity today; null when there is none (idle). */
export function activityView(state: Partial<ResourceState>): StateView | null {
  switch (state.activity_status?.value) {
    case "active":
      return { label: "In use", tone: "info", icon: <UserRound size={ICON_SIZE} />, detail: "In use now: a booking is in progress or someone is working on it." };
    case "scheduled":
      return { label: "Booked", tone: "reserved", icon: <CalendarCheck2 size={ICON_SIZE} />, detail: "An approved booking starts later today." };
    default:
      return null;
  }
}
