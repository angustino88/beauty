/*
 * Benches show their three independent states in three columns. Each column has its own filter,
 * mapped to its own server filter, and a header hint that says what the state means.
 *
 *   column key    server filter       state
 *   status        condition           availability (can it be used now)
 *   activity      activity_status     booking activity today
 *   lifecycle     lifecycle_status    planned → in service → retired
 */

type Filter = { text: string; value: string };
type FilterValues = readonly (string | number)[] | null | undefined;

export const AVAILABILITY_FILTERS: Filter[] = [
  { text: "Operational", value: "operational" },
  { text: "In maintenance", value: "in_maintenance" },
  { text: "Out of service", value: "out_of_service" },
];

export const ACTIVITY_FILTERS: Filter[] = [
  { text: "No booking", value: "idle" },
  { text: "Booked (later today)", value: "scheduled" },
  { text: "In use now", value: "active" },
];

export const LIFECYCLE_FILTERS: Filter[] = [
  { text: "Planned", value: "planned" },
  { text: "In service", value: "in_service" },
  { text: "Retired", value: "retired" },
];

export const STATE_COLUMN_HINTS = {
  availability: "Can it be used now? Set by its own condition and by downtime of its station or room.",
  activity: "Bookings today: in use now, booked for later today, or none. Rooms and stations count the benches they hold.",
  lifecycle: "Stage in its life: planned, in service, or retired.",
} as const;

const csv = (values: FilterValues) => (values?.length ? values.map(String).join(",") : undefined);

/** Column filters → server query parameters (comma-separated, OR within each filter). */
export function stateFilterParams(filters: { status?: FilterValues; activity?: FilterValues; lifecycle?: FilterValues }) {
  return {
    condition: csv(filters.status),
    activity_status: csv(filters.activity),
    lifecycle_status: csv(filters.lifecycle),
  };
}
