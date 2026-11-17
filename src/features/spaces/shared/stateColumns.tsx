import type { Key } from "react";
import type { ColumnType } from "antd/es/table";
import { AvailabilityBadge, StateBadge } from "./components/ResourceStateCells";
import { activityView, availabilityView, lifecycleView, type SpaceKind } from "./resourceStatusViews";
import { ACTIVITY_FILTERS, AVAILABILITY_FILTERS, LIFECYCLE_FILTERS, STATE_COLUMN_HINTS } from "./resourceStatusFilter";
import type { AccessPolicy, Choice, ResourceState } from "./resourceStatus";

type Row = Partial<ResourceState> & { access_policy?: Choice<AccessPolicy> | null };

/**
 * Lifecycle (main status), Availability and Activity columns, identical on the room, station and bench
 * tables, all drawn with the standard status badge. Lifecycle comes first and is always visible
 * (key `status`); Activity is hidden by default and can be turned on in View options.
 * Map the column filters to the server with stateFilterParams.
 */
export function buildStateColumns<T extends Row>(kind: SpaceKind, activeFilters: Record<string, Key[] | null>): ColumnType<T>[] {
  return [
    {
      title: "Lifecycle",
      key: "status",
      width: 132,
      filters: LIFECYCLE_FILTERS,
      filteredValue: activeFilters.status ?? null,
      onHeaderCell: () => ({ title: STATE_COLUMN_HINTS.lifecycle }),
      render: (_: unknown, record: T) => <StateBadge view={lifecycleView(record)} />,
    },
    {
      title: "Availability",
      key: "availability",
      width: 175,
      filters: AVAILABILITY_FILTERS,
      filteredValue: activeFilters.availability ?? null,
      onHeaderCell: () => ({ title: STATE_COLUMN_HINTS.availability }),
      render: (_: unknown, record: T) => <AvailabilityBadge view={availabilityView(record)} accessPolicy={record.access_policy} />,
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
  ];
}
