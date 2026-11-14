import { groupStatusCounts } from '../../../shared/utils/statusSummary.ts';
import { normalizeSpaceStatus, spaceStatusLabel, spaceStatusTone } from './spaceStatus.ts';

type StatusCount = { status: { value: string; label?: string }; resource_count: number };
type SpaceKind = 'room' | 'station' | 'bench';

const featuredOrder: Record<'room' | 'station', readonly string[]> = {
  room: ['available', 'maintenance', 'issue', 'closed', 'retired'],
  station: ['available', 'maintenance', 'issue', 'retired'],
};

const descriptionsByStatus: Record<string, string> = {
  operational: 'Ready for placement & use',
  in_use: 'Active user session',
  scheduled: 'Booked today',
  reserved: 'Booked today',
  maintenance: 'Being serviced',
  in_maintenance: 'Being serviced',
  issue: 'Reported fault, not usable',
  out_of_service: 'Not usable until repaired',
  closed: 'Access restricted or closed',
  restricted: 'Restricted access only',
  retired: 'Decommissioned from service',
  planned: 'Planned infrastructure',
};

/** The lifecycle summary defines the available statuses; no space state is invented by the UI. */
export function spaceOverviewStatuses(statuses: readonly StatusCount[], kind: SpaceKind = 'bench') {
  const groups = groupStatusCounts(
    statuses.map(({ status, resource_count }) => ({ status, count: resource_count })),
    normalizeSpaceStatus,
    spaceStatusLabel,
  );
  const featured = kind === 'bench'
    ? groups
    : featuredOrder[kind]
        .map((value) => groups.find(({ status }) => status.value === value))
        .filter((group): group is (typeof groups)[number] => group !== undefined);

  return featured.map(({ status }) => {
    let label = status.label || spaceStatusLabel(status.value);
    let description = descriptionsByStatus[status.value] ?? '';
    if ((kind === 'room' || kind === 'station') && status.value === 'available') {
      label = 'Operational';
      description = 'Ready for placement & use';
    } else if (kind === 'bench' && status.value === 'available') {
      description = 'Available for booking';
    }
    return {
      key: status.value,
      label,
      description,
      tone: spaceStatusTone(status.value),
    };
  });
}