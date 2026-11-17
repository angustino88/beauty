/*
 * The bench Status column shows availability, booking activity and lifecycle in one cell, with one
 * grouped filter. Each filter value is `<group>:<value>`; the groups map to the three separate
 * server filters, so the states stay separate on the wire.
 */

const LIFECYCLE_KEY = "lifecycle";
const AVAILABILITY_KEY = "condition";
const ACTIVITY_KEY = "activity";

/**
 * Grouped filter for the single Status column. Each value is `<group>:<value>` so the table hook
 * can send the three server filters (lifecycle_status, condition, activity_status) separately.
 */
export const RESOURCE_STATUS_FILTERS = [
  {
    text: "Availability",
    value: `${AVAILABILITY_KEY}:*`,
    children: [
      { text: "Operational (available)", value: `${AVAILABILITY_KEY}:operational` },
      { text: "In maintenance", value: `${AVAILABILITY_KEY}:in_maintenance` },
      { text: "Out of service", value: `${AVAILABILITY_KEY}:out_of_service` },
    ],
  },
  {
    text: "Activity today",
    value: `${ACTIVITY_KEY}:*`,
    children: [
      { text: "No booking", value: `${ACTIVITY_KEY}:idle` },
      { text: "Booked", value: `${ACTIVITY_KEY}:scheduled` },
      { text: "In use now", value: `${ACTIVITY_KEY}:active` },
    ],
  },
  {
    text: "Lifecycle",
    value: `${LIFECYCLE_KEY}:*`,
    children: [
      { text: "Planned", value: `${LIFECYCLE_KEY}:planned` },
      { text: "In service", value: `${LIFECYCLE_KEY}:in_service` },
      { text: "Retired", value: `${LIFECYCLE_KEY}:retired` },
    ],
  },
];

/** Split the grouped Status filter into the three server parameters (comma-separated, OR within each). */
export function splitStatusFilter(values: readonly (string | number)[] | null | undefined) {
  const groups: Record<string, string[]> = { [LIFECYCLE_KEY]: [], [AVAILABILITY_KEY]: [], [ACTIVITY_KEY]: [] };
  for (const raw of values ?? []) {
    const [group, value] = String(raw).split(":");
    if (value && value !== "*" && groups[group]) groups[group].push(value);
  }
  const csv = (list: string[]) => (list.length ? list.join(",") : undefined);
  return {
    lifecycle_status: csv(groups[LIFECYCLE_KEY]),
    condition: csv(groups[AVAILABILITY_KEY]),
    activity_status: csv(groups[ACTIVITY_KEY]),
  };
}
