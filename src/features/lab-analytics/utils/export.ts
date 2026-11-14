import type { LabSessionLogEntry } from '../types';

export interface ExcelColumn<T = unknown> {
  title: string;
  dataIndex: string | string[];
  displayKey?: string;
  width?: number;
  read?: (row: T) => string | number | null | undefined;
}

const LabSessionLogColumnIndex: { title: string; dataIndex: string | string[] }[] = [
  { title: 'ID', dataIndex: 'id' },
  { title: 'Computer Name', dataIndex: 'computer_name' },
  { title: 'Login time', dataIndex: 'login_time' },
  { title: 'Logout time', dataIndex: 'logout_time' },
  { title: 'Duration [H]', dataIndex: 'duration_in_hour' },
  { title: 'Active Time [H]', dataIndex: 'active_time_in_hour' },
  { title: 'Remote User', dataIndex: 'remote_user' },
  { title: 'Remote Computer', dataIndex: 'remote_computer' },
  { title: 'Remote IP', dataIndex: 'remote_ip' },
  { title: 'Booking Code', dataIndex: 'booking_code' },
  { title: 'Project', dataIndex: ['booking_info', 'project'] },
  { title: 'From Datetime', dataIndex: ['booking_info', 'from_date_time'] },
  { title: 'To Datetime', dataIndex: ['booking_info', 'to_date_time'] },
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
