import { InlineAlert } from '@/shared/notifications';
import { Link } from 'react-router-dom';
import { baseApi } from '@/shared/lib/api';
import EquipmentInventoryOverview from '@/features/lab-equipment/shared/components/cards/EquipmentInventoryOverview';
import { normalizeStatusKey, toneForStatus } from '@/shared/status/statusTone';
import { lifecycleSummaryCards } from './spaceOverviewStatuses';

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

  const counts = data?.statuses ?? [];
  const statuses = counts.map(({ status, resource_count }) => ({ status, count: resource_count }));

  return (
    <>
      {isError && (
        <InlineAlert
          variant="warning"
          title="Lifecycle totals are temporarily unavailable"
          onRetry={() => void refetch()}
        />
      )}
      <EquipmentInventoryOverview
        total={data?.total_count}
        statuses={statuses}
        unknownCount={data?.unknown_status_count}
        loading={isLoading}
        resourceLabel={nouns[kind]}
        scopeLabel="Lifecycle across all spaces"
        featuredStatuses={lifecycleSummaryCards(counts)}
        showAvailabilityInsights={false}
        fillWidth
        statusTone={toneForStatus}
        normalizeStatus={normalizeStatusKey}
        footer={<Link to="/spaces/mapping">Explore placement →</Link>}
      />
    </>
  );
}
