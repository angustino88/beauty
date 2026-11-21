import type { StatusTone } from '../../../shared/status/statusTone.ts';
export type Choice<T extends string = string> = { value: T; label: string };

export type LifecycleStatus = 'planned' | 'in_service' | 'retired';
export type AccessPolicy = 'open' | 'restricted';
export type Condition = 'operational' | 'in_maintenance' | 'out_of_service';
export type ActivityStatus = 'idle' | 'scheduled' | 'active';
export type ResourceType = 'room' | 'station' | 'bench' | 'equipment';
export type DowntimeReason =
  | 'maintenance'
  | 'fault'
  | 'calibration'
  | 'safety_hold'
  | 'renovation'
  | 'other';
export type DowntimeKind = 'planned' | 'unplanned';
export type DowntimeState = 'scheduled' | 'current' | 'ended' | 'cancelled';
/** Who may still book the benches a downtime window covers. */
export type DowntimeBookingAccess = 'closed' | 'lab_operators';

export const BOOKING_ACCESS_LABELS: Record<DowntimeBookingAccess, string> = {
  closed: 'No one',
  lab_operators: 'Lab operators only',
};

export interface Availability {
  value: 'available' | 'unavailable';
  blocked_by: { type: 'room' | 'station' | 'bench'; id: number; name: string } | null;
  condition: Condition | null;
  reason: DowntimeReason | LifecycleStatus | null;
  /** While unavailable: lab_operators when lab coordinators and administrators can still book, else closed. */
  booking_access?: DowntimeBookingAccess | null;
}

/** Shared by Room, Station and Bench reads. */
export interface ResourceState {
  lifecycle_status: Choice<LifecycleStatus>;
  condition: Choice<Condition>;
  availability: Availability;
  activity_status: Choice<ActivityStatus>;
  /** @deprecated use the fields above (section 9). */
  status?: Choice<string> | string | null;
}

export interface LocationState extends ResourceState {
  access_policy: Choice<AccessPolicy>;
}

export interface DowntimeActor {
  id: number;
  username: string;
  display_name: string;
}

export interface Downtime {
  id: number;
  resource: { type: ResourceType; id: number };
  condition: Choice<'in_maintenance' | 'out_of_service'>;
  kind: Choice<DowntimeKind>;
  reason: Choice<DowntimeReason>;
  booking_access: Choice<DowntimeBookingAccess>;
  state: DowntimeState;
  starts_at: string; // ISO 8601 with offset
  ends_at: string | null; // null: end not known yet
  cancelled_at: string | null;
  notes: string;
  actor: DowntimeActor | null;
  ended_by: DowntimeActor | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleDowntimeRequest {
  resource_type: ResourceType;
  resource_id: number;
  condition: 'in_maintenance' | 'out_of_service';
  reason?: DowntimeReason; // default "other"
  kind?: DowntimeKind | null; // default: planned if it starts later, else unplanned
  starts_at?: string | null; // default: now
  ends_at?: string | null; // default: open-ended
  notes?: string; // max 2000
  cancel_conflicting_bookings?: boolean; // default false
  booking_access?: DowntimeBookingAccess; // default closed; lab_operators is refused for equipment
}

export interface ChangeDowntimeBookingAccessRequest {
  downtimeId: number;
  booking_access: DowntimeBookingAccess;
  cancel_conflicting_bookings?: boolean; // closing: cancel bookings that overlap the rest of the window
}

export interface DowntimeConflictBooking {
  kind: 'bench_bookings' | 'equipment_bookings';
  id: number;
  message: string;
}

export interface DowntimeConflictDetail {
  field: string | null;
  code: string;
  message: string;
}

export type BadgeTone = StatusTone;

export interface ResourceBadgeResult {
  text: string;
  tone: BadgeTone;
}

/**
 * Section 4.1 One badge for lists and cards:
 * Picked in priority order (first match wins):
 * 1. lifecycle_status === "retired" -> { text: "Retired", tone: "neutral" }
 * 2. lifecycle_status === "planned" -> { text: "Planned", tone: "info" }
 * 3. condition !== "operational" -> { text: condition.label, tone: "danger" (out_of_service) | "warning" (in_maintenance) }
 * 4. availability.value === "unavailable" && blocked_by -> { text: "Unavailable (type name)", tone: "warning" }
 * 5. If room or station and operational -> { text: "Operational", tone: "success" }
 * 6. Default (bench/asset) -> { text: "Available", tone: "success" }
 *
 * Booking activity is a separate field and state machine; tables show it in its
 * own column (resourceStatusViews.activityView).
 */
export function resourceBadge(
  r?: Partial<ResourceState> | null,
  resourceType?: ResourceType,
): ResourceBadgeResult {
  if (!r || !r.lifecycle_status) return { text: 'Unknown', tone: 'neutral' };
  const a = r.availability;
  if (r.lifecycle_status.value === 'retired') return { text: 'Retired', tone: 'neutral' };
  if (r.lifecycle_status.value === 'planned') return { text: 'Planned', tone: 'info' };
  if (r.condition && r.condition.value !== 'operational') {
    return {
      text: r.condition.label || (r.condition.value === 'out_of_service' ? 'Out of service' : 'In maintenance'),
      tone: r.condition.value === 'out_of_service' ? 'danger' : 'warning',
    };
  }
  if (a && a.value === 'unavailable' && a.blocked_by) {
    const typeLabel =
      a.blocked_by.type.charAt(0).toUpperCase() + a.blocked_by.type.slice(1);
    return {
      text: `Unavailable (${typeLabel} ${a.blocked_by.name})`,
      tone: 'warning',
    };
  }
  if (resourceType === 'room' || resourceType === 'station') {
    return { text: 'Operational', tone: 'success' };
  }
  return { text: 'Available', tone: 'success' };
}

/**
 * Section 6.1: Parse conflict details into structured bookings
 */
export function parseDowntimeBookingConflicts(
  details?: Array<{ field?: string | null; code?: string; message?: string }>,
): DowntimeConflictBooking[] {
  if (!details || !Array.isArray(details)) return [];
  return details
    .filter((d) => d.code === 'booking_overlaps_downtime' && d.field)
    .map((d) => {
      const parts = (d.field ?? '').split('.');
      const kind = parts[0] as 'bench_bookings' | 'equipment_bookings';
      const id = Number(parts[1]);
      return {
        kind,
        id,
        message: d.message || `Booking #${id} overlaps downtime.`,
      };
    })
    .filter((b) => Number.isFinite(b.id));
}

/**
 * Section 6.3: Allowed moves
 * planned -> in_service, planned -> retired, in_service -> retired
 */
export function getAllowedLifecycleTransitions(
  current: LifecycleStatus | undefined,
): LifecycleStatus[] {
  if (current === 'planned') {
    return ['in_service', 'retired'];
  }
  if (current === 'in_service') {
    return ['retired'];
  }
  return [];
}

export const LIFECYCLE_STATUS_LABELS: Record<LifecycleStatus, string> = {
  planned: 'Planned',
  in_service: 'In service',
  retired: 'Retired',
};

export const ACCESS_POLICY_LABELS: Record<AccessPolicy, string> = {
  open: 'Open',
  restricted: 'Restricted',
};

export const CONDITION_LABELS: Record<Condition, string> = {
  operational: 'Operational',
  in_maintenance: 'In maintenance',
  out_of_service: 'Out of service',
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  idle: 'Idle',
  scheduled: 'Scheduled',
  active: 'Active',
};

export const DOWNTIME_REASON_LABELS: Record<DowntimeReason, string> = {
  maintenance: 'Maintenance',
  fault: 'Fault',
  calibration: 'Calibration',
  safety_hold: 'Safety hold',
  renovation: 'Renovation',
  other: 'Other',
};

export function mapChoice<T extends string>(
  raw: unknown,
  fallbackValue: T,
  fallbackLabel?: string,
): Choice<T> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const rec = raw as Record<string, unknown>;
    const value = (typeof rec.value === 'string' && rec.value.trim() ? rec.value.trim() : fallbackValue) as T;
    const label = typeof rec.label === 'string' && rec.label.trim() ? rec.label.trim() : (fallbackLabel ?? value);
    return { value, label };
  }
  if (typeof raw === 'string' && raw.trim()) {
    const value = raw.trim() as T;
    return { value, label: fallbackLabel ?? value };
  }
  return { value: fallbackValue, label: fallbackLabel ?? fallbackValue };
}

export function mapAvailability(raw: unknown): Availability {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      value: 'available',
      blocked_by: null,
      condition: null,
      reason: null,
      booking_access: null,
    };
  }
  const rec = raw as Record<string, unknown>;
  const blocked =
    rec.blocked_by && typeof rec.blocked_by === 'object' && !Array.isArray(rec.blocked_by)
      ? (rec.blocked_by as Record<string, unknown>)
      : null;

  return {
    value: rec.value === 'unavailable' ? 'unavailable' : 'available',
    blocked_by: blocked
      ? {
          type: (blocked.type as 'room' | 'station' | 'bench') || 'room',
          id: Number(blocked.id) || 0,
          name: String(blocked.name || ''),
        }
      : null,
    condition: (rec.condition as Condition) ?? null,
    reason: (rec.reason as DowntimeReason | LifecycleStatus) ?? null,
    booking_access: bookingAccessOf(rec.booking_access),
  };
}

/** Reads `booking_access` sent as a plain value or as `{ value, label }`; anything else is null. */
export function bookingAccessOf(raw: unknown): DowntimeBookingAccess | null {
  const value =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>).value : raw;
  return value === 'closed' || value === 'lab_operators' ? value : null;
}

