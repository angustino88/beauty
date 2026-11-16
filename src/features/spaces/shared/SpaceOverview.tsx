import { Alert } from 'antd';
import { Link } from 'react-router-dom';
import { baseApi } from '@/shared/lib/api';
import EquipmentInventoryOverview from '@/features/lab-equipment/shared/components/cards/EquipmentInventoryOverview';
import { normalizeSpaceStatus, spaceStatusLabel, spaceStatusTone } from './spaceStatus';
import { spaceOverviewStatuses } from './spaceOverviewStatuses';

type SpaceKind = 'room' | 'station' | 'bench';
type StatusCount = { status: { value: string; label: string }; resource_count: number };
type StatusSummary = { total_count: number; unknown_status_count: number; statuses: StatusCount[] };

const spaceSummaryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSpaceStatusSummary: build.query<StatusSummary, SpaceKind>({
      query: (kind) => `/api/labs/${kind === 'bench' ? 'benches' : `${kind}s`}/status-summary`,
      transformResponse: (response: unknown): StatusSummary => {
        if (!response || typeof response !== 'object') {
          return { total_count: 0, unknown_status_count: 0, statuses: [] };
        }
        const envelope = response as { data?: unknown } & Partial<StatusSummary>;
        const summary = envelope.data && typeof envelope.data === 'object'
          ? envelope.data as Partial<StatusSummary>
          : envelope;
        return {
          total_count: summary.total_count ?? 0,
          unknown_status_count: summary.unknown_status_count ?? 0,
          statuses: summary.statuses ?? [],
        };
      },
      providesTags: (_result, _error, kind) => [
        { type: kind === 'room' ? 'Room' : kind === 'station' ? 'Station' : 'Bench', id: 'LIST' },
      ],
    }),
  }),
});

const { useGetSpaceStatusSummaryQuery } = spaceSummaryApi;

const nouns: Record<SpaceKind, string> = { room: 'rooms', station: 'stations', bench: 'benches' };

export default function SpaceOverview({ kind }: { kind: SpaceKind }) {
  const { data, isLoading, isError, refetch } = useGetSpaceStatusSummaryQuery(kind);

  const getStatusLabel = (val: unknown) => {
    const norm = normalizeSpaceStatus(val);
    if ((kind === 'room' || kind === 'station') && norm === 'available') {
      return 'Operational';
    }
    return spaceStatusLabel(val);
  };

  // A booked room or station is still operational, so its count belongs to "Operational" instead of vanishing
  // from the tiles (which would leave the tiles adding up to less than the total).
  const statuses = (() => {
    const source = data?.statuses ?? [];
    if (kind !== 'room' && kind !== 'station') return source;
    const reserved = source
      .filter(({ status }) => normalizeSpaceStatus(status.value) === 'reserved')
      .reduce((sum, { resource_count }) => sum + resource_count, 0);
    return source
      .filter(({ status }) => normalizeSpaceStatus(status.value) !== 'reserved')
      .map((entry) => normalizeSpaceStatus(entry.status.value) === 'available'
        ? { ...entry, resource_count: entry.resource_count + reserved }
        : entry);
  })();

  const filteredStatuses = statuses.map(({ status, resource_count }) => ({
    status: {
      value: normalizeSpaceStatus(status.value),
      label:
        (kind === 'room' || kind === 'station') && normalizeSpaceStatus(status.value) === 'available'
          ? 'Operational'
          : status.label,
    },
    count: resource_count,
  }));

  return (
    <>
      {isError && (
        <Alert
          type="warning"
          showIcon
          message="Lifecycle totals are unavailable"
          description={
            <a
              href="#retry-status"
              onClick={(event) => {
                event.preventDefault();
                void refetch();
              }}
            >
              Try again
            </a>
          }
        />
      )}
      <EquipmentInventoryOverview
        total={data?.total_count}
        statuses={filteredStatuses}
        unknownCount={data?.unknown_status_count}
        loading={isLoading}
        resourceLabel={nouns[kind]}
        scopeLabel="Across all spaces, not just this page"
        featuredStatuses={spaceOverviewStatuses(statuses, kind)}
        showAllOtherStatuses={kind === 'bench'}
        showOtherStatuses={kind === 'bench'}
        fillWidth
        statusTone={spaceStatusTone}
        normalizeStatus={normalizeSpaceStatus}
        statusLabel={getStatusLabel}
        footer={<Link to="/spaces/mapping">Explore placement →</Link>}
      />
    </>
  );
}
