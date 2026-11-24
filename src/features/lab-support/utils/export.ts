import type { SupportTicket, SupportUserRef } from '../types';

const LAB_SUPPORT_COLUMNS: { title: string; read: (ticket: SupportTicket) => string }[] = [
  { title: 'Key', read: (ticket) => ticket.key ?? '' },
  { title: 'Subject', read: (ticket) => String(ticket.subject ?? '') },
  { title: 'Category', read: (ticket) => ticket.category?.name ?? '' },
  { title: 'Priority', read: (ticket) => readNestedName(ticket.priority) },
  { title: 'Status', read: (ticket) => readNestedName(ticket.status) },
  { title: 'Requester', read: (ticket) => readUser(ticket.requester) },
  { title: 'Assignee', read: (ticket) => readUser(ticket.assignee) },
  { title: 'Created Date', read: (ticket) => String(ticket.created_at ?? '') },
  { title: 'Due Date', read: (ticket) => String(ticket.due_date ?? '') },
  { title: 'Resolved Date', read: (ticket) => String(ticket.resolved_at ?? '') },
];

function readNestedName(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return '';
}

function readUser(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const user = value as SupportUserRef;
    return user.displayName ?? user.display_name ?? user.username ?? '';
  }
  return '';
}

export async function exportLabSupportExcel(rows: SupportTicket[], fileName: string): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Support Tickets');

  sheet.addRow(LAB_SUPPORT_COLUMNS.map((column) => column.title));
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  for (const row of rows) {
    sheet.addRow(LAB_SUPPORT_COLUMNS.map((column) => column.read(row)));
  }

  sheet.eachRow((row, rowIndex) => {
    if (rowIndex > 1) {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  });

  LAB_SUPPORT_COLUMNS.forEach((_, index) => {
    sheet.getColumn(index + 1).width = 24;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileName}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
