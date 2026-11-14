export const EQUIPMENT_OVERVIEW_FEATURED_STATUSES = [
  { key: 'in_use', label: 'In use', description: 'Assigned', tone: 'blue' },
  { key: 'available', label: 'Available', description: 'Ready to use', tone: 'green' },
  { key: 'borrowed', label: 'Borrowed', description: 'Checked out', tone: 'amber' },
  { key: 'broken', label: 'Broken', description: 'Out of service', tone: 'red' },
  { key: 'maintenance', label: 'Maintenance', description: 'Needs attention', tone: 'violet' },
] as const;
