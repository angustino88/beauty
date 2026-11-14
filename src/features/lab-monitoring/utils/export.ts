import type { ILabMonitoring } from '../types';

const LabMonitoringColumnIndex: { title: string; dataIndex: keyof ILabMonitoring | 'details_str' }[] = [
  { title: 'ID', dataIndex: 'id' },
  { title: 'Timestamp', dataIndex: 'created' },
  { title: 'Source', dataIndex: 'source' },
  { title: 'Computer Name', dataIndex: 'computer_name' },
  { title: 'Technical User', dataIndex: 'technical_user' },
  { title: 'Remote User', dataIndex: 'remote_user' },
  { title: 'Event Type', dataIndex: 'event_type' },
  { title: 'Category', dataIndex: 'category' },
  { title: 'Object Name', dataIndex: 'object_name' },
  { title: 'Object ID', dataIndex: 'object_id' },
  { title: 'Details', dataIndex: 'details_str' },
];

export async function exportMonitoringExcel(rows: ILabMonitoring[], fileName: string): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Lab Monitoring');

  ws.addRow(LabMonitoringColumnIndex.map((c) => c.title));
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  for (const row of rows) {
    ws.addRow(
      LabMonitoringColumnIndex.map((col) => {
        const val = row[col.dataIndex as keyof ILabMonitoring];
        if (val == null) return '';
        if (Array.isArray(val)) {
          return val.map((entry) => Object.entries(entry).map(([k, v]) => `${k}: ${v}`).join(', ')).join(' | ');
        }
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      })
    );
  }

  ws.eachRow((row, idx) => {
    if (idx > 1) {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    }
  });
  LabMonitoringColumnIndex.forEach((_, i) => { ws.getColumn(i + 1).width = 22; });

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
