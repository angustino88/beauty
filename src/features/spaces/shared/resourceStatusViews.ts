import { LIFECYCLE_STATUS_LABELS, type ResourceState } from "./resourceStatus.ts";
import type { StatusTone } from "../../../shared/status/statusTone.ts";

/*
 * Label, colour and explanation of each of the three independent states of a room, station or
 * bench. Every table and card uses these, so a state reads and looks the same everywhere, and the
 * tones match the status overview tiles (planned blue, in service green, out of service red,
 * retired grey).
 *   availability      can it be used now (its condition and its parents' downtime)
 *   activity_status   bookings today
 *   lifecycle_status  planned → in service → retired
 */

export type SpaceKind = "room" | "station" | "bench";

export interface StateView {
  label: string;
  tone: StatusTone;
  /** One sentence for the hover tooltip. */
  detail: string;
}

type State = Partial<ResourceState>;

export function lifecycleView(state: State): StateView {
  switch (state.lifecycle_status?.value) {
    case "planned":
      return { label: LIFECYCLE_STATUS_LABELS.planned, tone: "info", detail: "Registered but not commissioned yet." };
    case "in_service":
      return { label: LIFECYCLE_STATUS_LABELS.in_service, tone: "success", detail: "Commissioned and part of the lab." };
    case "retired":
      return { label: LIFECYCLE_STATUS_LABELS.retired, tone: "neutral", detail: "Decommissioned; kept for history only." };
    default:
      return { label: "Unknown", tone: "neutral", detail: "No lifecycle recorded." };
  }
}

/** Available, or why not: its own condition first, then a parent space that blocks it. */
export function availabilityView(state: State): StateView {
  const lifecycle = state.lifecycle_status?.value;
  const availability = state.availability;
  if (lifecycle === "planned" || lifecycle === "retired") {
    return { label: "Not in service", tone: "neutral", detail: "Only in-service spaces can be used or booked." };
  }
  if (state.condition?.value === "out_of_service") {
    return { label: "Out of service", tone: "danger", detail: "Not usable until it is repaired." };
  }
  if (state.condition?.value === "in_maintenance") {
    return { label: "In maintenance", tone: "warning", detail: "Temporarily unavailable while it is serviced." };
  }
  if (availability?.value === "unavailable") {
    const blocker = availability.blocked_by;
    const reason = availability.reason ? availability.reason.replaceAll("_", " ") : "unavailable";
    return {
      label: blocker ? `Blocked by ${blocker.type}` : "Unavailable",
      tone: "warning",
      detail: blocker ? `Its ${blocker.type} ${blocker.name} is ${reason}.` : `Unavailable (${reason}).`,
    };
  }
  return { label: "Available", tone: "success", detail: "Can be used and booked." };
}

/** Bookings today. Rooms and stations roll up from the benches they hold. */
export function activityView(state: State, kind: SpaceKind = "bench"): StateView {
  const scope = kind === "bench" ? "" : ` on a bench in this ${kind}`;
  switch (state.activity_status?.value) {
    case "active":
      return { label: "In use", tone: "info", detail: `In use now: a booking is in progress or someone is working${scope}.` };
    case "scheduled":
      return { label: "Booked", tone: "reserved", detail: `An approved booking${scope} starts later today.` };
    default:
      return { label: "No booking", tone: "neutral", detail: `No booking${scope} today.` };
  }
}
