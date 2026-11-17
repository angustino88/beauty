import type { Key } from "react";
import type { ColumnType } from "antd/es/table";
import { AvailabilityText, MainStateBadge, StateText } from "./components/ResourceStateCells";
import { activityView, availabilityView, lifecycleView, type SpaceKind } from "./resourceStatusViews";
import { ACTIVITY_FILTERS, AVAILABILITY_FILTERS, LIFECYCLE_FILTERS, STATE_COLUMN_HINTS } from "./resourceStatusFilter";
import type { AccessPolicy, Choice, ResourceState } from "./resourceStatus";

type Row = Partial<ResourceState> & { access_policy?: Choice<AccessPolicy> | null };

/**
 * Status (lifecycle), Availability and Activity columns, identical on the room, station and bench
 * tables. The lifecycle is the main status: first, a filled pill, always visible (key `status`).
 * Availability and activity follow as dot-and-text, coloured only when something needs attention.
 * Map the column filters to the server with stateFilterParams.
 */
export function buildStateColumns<T extends Row>(kind: SpaceKind, activeFilters: Record<string, Key[] | null>): ColumnType<T>[] {
  return [
    {
      title: "Status",
      key: "status",
      width: 132,
      filters: LIFECYCLE_FILTERS,
      filteredValue: activeFilters.status ?? null,
      onHeaderCell: () => ({ title: STATE_COLUMN_HINTS.lifecycle }),
      render: (_: unknown, record: T) => <MainStateBadge view={lifecycleView(record)} />,
    },
    {
      title: "Availability",
      key: "availability",
      width: 165,
      filters: AVAILABILITY_FILTERS,
      filteredValue: activeFilters.availability ?? null,
      onHeaderCell: () => ({ title: STATE_COLUMN_HINTS.availability }),
      render: (_: unknown, record: T) => <AvailabilityText view={availabilityView(record)} accessPolicy={record.access_policy} />,
    },
    {
      title: "Activity",
      key: "activity",
      width: 120,
      filters: ACTIVITY_FILTERS,
      filteredValue: activeFilters.activity ?? null,
      onHeaderCell: () => ({ title: STATE_COLUMN_HINTS.activity }),
      render: (_: unknown, record: T) => {
        const view = activityView(record, kind);
        return <StateText view={view} empty={record.activity_status?.value !== "active" && record.activity_status?.value !== "scheduled"} />;
      },
    },
  ];
}
