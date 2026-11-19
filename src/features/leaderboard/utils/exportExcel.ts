type Row = Record<string, unknown>;
type Column = { title: string; value: (row: Row) => string | number };

const text = (v: unknown): string => (v == null ? '' : String(v));
/** Rates are 0–1; an empty cell means the KPI does not apply (for example no bookings). */
const rate = (v: unknown): number | string => (typeof v === 'number' ? v : '');
const projects = (v: unknown): string => (Array.isArray(v) ? v.map((p) => text(typeof p === 'string' ? p : (p as Row)?.name ?? (p as Row)?.project_name)).join(', ') : '');

export const PERSONA_COLUMNS: Column[] = [
  { title: 'Username', value: (r) => text(r.username) },
  { title: 'Name', value: (r) => text(r.display_name) },
  { title: 'Points', value: (r) => Number(r.points ?? 0) },
  { title: 'RFO rate (remote from office)', value: (r) => Number(r.wfo_rate ?? 0) },
  { title: 'RFH rate (remote from home)', value: (r) => Number(r.wfh_rate ?? 0) },
  { title: 'Late rate', value: (r) => Number(r.late_rate ?? 0) },
  { title: 'Labs accessed', value: (r) => Number(r.labs_accessed ?? 0) },
  { title: 'Usage efficiency', value: (r) => Number(r.usage_efficiency ?? 0) },
  { title: 'Total bookings', value: (r) => Number(r.total_bookings ?? 0) },
  { title: 'No-show bookings', value: (r) => Number(r.no_show_bookings ?? 0) },
  { title: 'Booking attendance', value: (r) => rate(r.booking_compliance) },
  { title: 'Booked time used', value: (r) => rate(r.booking_utilization) },
  { title: 'Slot adherence', value: (r) => rate(r.slot_adherence) },
  { title: 'Active rate', value: (r) => rate(r.active_rate) },
  { title: 'Sessions without booking', value: (r) => rate(r.ad_hoc_rate) },
  { title: 'Total sessions', value: (r) => Number(r.total_sessions ?? 0) },
  { title: 'Total usage (min)', value: (r) => Number(r.total_usage_minutes ?? 0) },
  { title: 'Active usage (min)', value: (r) => Number(r.active_usage_minutes ?? 0) },
  { title: 'Avg session (min)', value: (r) => Number(r.avg_session_minutes ?? 0) },
  { title: 'Longest session (min)', value: (r) => Number(r.longest_session_minutes ?? 0) },
  { title: 'Last remote', value: (r) => text(r.last_remote_at) },
  { title: 'Top projects', value: (r) => projects(r.top_projects) },
];

export const LAB_COLUMNS: Column[] = [
  { title: 'Lab', value: (r) => text(r.name) },
  { title: 'Points', value: (r) => Number(r.points ?? 0) },
  { title: 'Total sessions', value: (r) => Number(r.total_sessions ?? 0) },
  { title: 'Active users', value: (r) => Number(r.active_users ?? 0) },
  { title: 'Active usage (min)', value: (r) => Number(r.total_usage_minutes ?? 0) },
  { title: 'Utilization', value: (r) => Number(r.utilization_rate ?? 0) },
  { title: 'Booking fill', value: (r) => Number(r.booking_fill ?? 0) },
  { title: 'Total bookings', value: (r) => Number(r.total_bookings ?? 0) },
  { title: 'No-show bookings', value: (r) => Number(r.no_show_bookings ?? 0) },
  { title: 'Booking attendance', value: (r) => rate(r.booking_compliance) },
  { title: 'Booked time used', value: (r) => rate(r.booking_utilization) },
  { title: 'Last remote', value: (r) => text(r.last_remote_at) },
  { title: 'Top projects', value: (r) => projects(r.top_projects) },
];

export async function exportLeaderboardExcel(rows: Row[], type: 'persona' | 'lab', fileName: string): Promise<void> {
  const columns = type === 'lab' ? LAB_COLUMNS : PERSONA_COLUMNS;
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(type === 'lab' ? 'Labs' : 'Users');
  sheet.addRow(columns.map((c) => c.title));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) sheet.addRow(columns.map((c) => c.value(row)));
  columns.forEach((_, i) => { sheet.getColumn(i + 1).width = 20; });

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 100);
}
