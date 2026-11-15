import type { ILabMonitoring } from '../types';

type Cell = string | number;

const LabMonitoringColumns: { title: string; value: (row: ILabMonitoring) => Cell }[] = [
  { title: 'ID', value: (r) => r.id },
  { title: 'Timestamp', value: (r) => r.occurred_at ?? '' },
  { title: 'Source', value: (r) => r.agent_key ?? '' },
  { title: 'Computer Name', value: (r) => r.computer?.name ?? '' },
  { title: 'Technical User', value: (r) => r.technical_user ?? '' },
  { title: 'Remote User', value: (r) => r.remote_user ?? '' },
  { title: 'Event Type', value: (r) => r.action?.label ?? '' },
  { title: 'Category', value: (r) => r.subject?.type ?? '' },
  { title: 'Object Name', value: (r) => r.subject?.name ?? '' },
  { title: 'Object ID', value: (r) => r.subject?.key ?? '' },
  { title: 'Details', value: (r) => (r.payload == null ? '' : JSON.stringify(r.payload)) },
];

export async function exportMonitoringExcel(rows: ILabMonitoring[], fileName: string): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Lab Monitoring');

  ws.addRow(LabMonitoringColumns.map((c) => c.title));
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  for (const row of rows) {
    ws.addRow(LabMonitoringColumns.map((col) => col.value(row)));
  }

  ws.eachRow((row, idx) => {
    if (idx > 1) {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    }
  });
  LabMonitoringColumns.forEach((_, i) => { ws.getColumn(i + 1).width = 22; });

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
