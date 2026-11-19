import type { LabSessionLogEntry } from '../types';

export interface ExcelColumn<T = unknown> {
  title: string;
  dataIndex: string | string[];
  displayKey?: string;
  width?: number;
  read?: (row: T) => string | number | null | undefined;
}

const minutes = (value: number | null) => (value == null ? '' : value);
const LabSessionLogColumnIndex: ExcelColumn<LabSessionLogEntry>[] = [
  { title: 'Login', dataIndex: 'login_at' },
  { title: 'Logout', dataIndex: 'logout_at' },
  { title: 'User', dataIndex: 'user', read: (row) => row.user?.display_name || row.remote_user_display_name || '' },
  { title: 'Login name', dataIndex: 'remote_user' },
  { title: 'Access', dataIndex: 'access_type', read: (row) => row.access_type?.label ?? '' },
  { title: 'Booking code', dataIndex: 'booking_code' },
  { title: 'Project', dataIndex: 'booking', read: (row) => row.booking?.project?.name ?? '' },
  { title: 'Booking start', dataIndex: 'booking', read: (row) => row.booking?.starts_at ?? '' },
  { title: 'Booking end', dataIndex: 'booking', read: (row) => row.booking?.ends_at ?? '' },
  { title: 'Booking status', dataIndex: 'booking', read: (row) => row.booking?.status?.label ?? '' },
  { title: 'Bench', dataIndex: 'bench', read: (row) => row.bench?.name ?? '' },
  { title: 'Computer', dataIndex: 'computer', read: (row) => row.computer?.name ?? '' },
  { title: 'Host name', dataIndex: 'host_name' },
  { title: 'Session (min)', dataIndex: 'duration_minutes', read: (row) => minutes(row.duration_minutes) },
  { title: 'Active (min)', dataIndex: 'active_minutes', read: (row) => minutes(row.active_minutes) },
];

function resolvePath(obj: unknown, path: string | string[]): string {
  const keys = Array.isArray(path) ? path : [path];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const val = keys.reduce<any>((acc, k) => (acc != null ? acc[k] : null), obj);
  if (val == null) return '';
  if (typeof val === 'object') return val.username ?? val.displayname ?? JSON.stringify(val);
  return String(val);
}

export async function exportRowsToExcel<T>(rows: T[], columns: ExcelColumn<T>[], fileName: string, sheetName = fileName): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(sheetName);

  ws.addRow(columns.map((c) => c.title));
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  for (const row of rows) {
    ws.addRow(columns.map((col) => {
      if (col.read) {
        const value = col.read(row);
        return value == null ? '' : String(value);
      }
      return resolvePath(row, col.dataIndex);
    }));
  }

  ws.eachRow((row, idx) => {
    if (idx > 1) {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    }
  });

  columns.forEach((column, index) => {
    ws.getColumn(index + 1).width = column.width ?? 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportSessionLogExcel(rows: LabSessionLogEntry[], fileName: string): Promise<void> {
  await exportRowsToExcel(rows, LabSessionLogColumnIndex, fileName, 'Lab Session Log');
}

export function exportChartAsSVG(ref: React.RefObject<HTMLElement>, filename: string): void {
  if (!ref.current) return;
  const element = ref.current.querySelector('.recharts-responsive-container');
  if (!element) return;
  const chartUrl = new XMLSerializer().serializeToString(element);
  const chartBlob = new Blob([chartUrl], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(chartBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
