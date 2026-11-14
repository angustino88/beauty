import type { StatusTone } from '../../../../../shared/status/statusTone.ts';

/** Ordered ready → busy → committed → needs attention, so the bar reads left to right. */
export const EQUIPMENT_OVERVIEW_FEATURED_STATUSES: ReadonlyArray<{ key: string; label: string; description: string; tone: StatusTone }> = [
  { key: 'available', label: 'Available', description: 'Ready to assign or lend', tone: 'success' },
  { key: 'in_use', label: 'In use', description: 'Placed on a bench', tone: 'info' },
  { key: 'borrowed', label: 'Borrowed', description: 'Checked out on loan', tone: 'violet' },
  { key: 'maintenance', label: 'Maintenance', description: 'Being serviced', tone: 'warning' },
  { key: 'broken', label: 'Broken', description: 'Out of service, needs repair', tone: 'danger' },
];
