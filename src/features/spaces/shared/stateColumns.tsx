import type { Key } from "react";
import type { ColumnType } from "antd/es/table";
import { AvailabilityBadge, StateBadge } from "./components/ResourceStateCells";
import { activityView, availabilityView, lifecycleView, type SpaceKind } from "./resourceStatusViews";
import { ACTIVITY_FILTERS, AVAILABILITY_FILTERS, LIFECYCLE_FILTERS, STATE_COLUMN_HINTS } from "./resourceStatusFilter";
import type { AccessPolicy, Choice, ResourceState } from "./resourceStatus";

type Row = Partial<ResourceState> & { access_policy?: Choice<AccessPolicy> | null };

/**
 * Availability, Activity and Lifecycle columns, identical on the room, station and bench tables:
 * same order, widths, pills, hover reasons, header hints and server filters. Keys: `status`
 * (availability, always shown), `activity`, `lifecycle`; map them with stateFilterParams.
 */
export function buildStateColumns<T extends Row>(kind: SpaceKind, activeFilters: Record<string, Key[] | null>): ColumnType<T>[] {
  return [
    {
      title: "Availability",
      key: "status",
      width: 170,
      filters: AVAILABILITY_FILTERS,
      filteredValue: activeFilters.status ?? null,
      onHeaderCell: () => ({ title: STATE_COLUMN_HINTS.availability }),
      render: (_: unknown, record: T) => <AvailabilityBadge view={availabilityView(record)} state={record} />,
    },
    {
      title: "Activity",
      key: "activity",
      width: 140,
      filters: ACTIVITY_FILTERS,
      filteredValue: activeFilters.activity ?? null,
      onHeaderCell: () => ({ title: STATE_COLUMN_HINTS.activity }),
      render: (_: unknown, record: T) => <StateBadge view={activityView(record, kind)} />,
    },
    {
      title: "Lifecycle",
      key: "lifecycle",
      width: 130,
      filters: LIFECYCLE_FILTERS,
      filteredValue: activeFilters.lifecycle ?? null,
      onHeaderCell: () => ({ title: STATE_COLUMN_HINTS.lifecycle }),
      render: (_: unknown, record: T) => <StateBadge view={lifecycleView(record)} />,
    },
  ];
}
