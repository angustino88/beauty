import type { SupportTicket, SupportUserRef } from '../types';

const LAB_SUPPORT_COLUMNS: { title: string; read: (issue: SupportTicket) => string }[] = [
  { title: 'Key', read: (issue) => issue.key ?? '' },
  { title: 'Subject', read: (issue) => String(issue.subject ?? issue.summary ?? issue.fields?.summary ?? '') },
  { title: 'Category', read: (issue) => issue.category?.name ?? '' },
  { title: 'Priority', read: (issue) => readNestedName(issue.priority, issue.fields?.priority) },
  { title: 'Status', read: (issue) => readNestedName(issue.status, issue.fields?.status) },
  { title: 'Requester', read: (issue) => readUser(issue.requester ?? issue.reporter ?? issue.fields?.reporter) },
  { title: 'Assignee', read: (issue) => readUser(issue.assignee ?? issue.fields?.assignee) },
  { title: 'Created Date', read: (issue) => String(issue.created_at ?? issue.created ?? issue.fields?.created ?? '') },
  { title: 'Due Date', read: (issue) => String(issue.duedate ?? issue.fields?.duedate ?? '') },
  { title: 'Resolved Date', read: (issue) => String(issue.resolved_at ?? issue.resolutiondate ?? issue.fields?.resolutiondate ?? '') },
];

function readNestedName(value: unknown, fallback?: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === 'string') return name;
  }
  if (typeof fallback === 'string') return fallback;
  if (typeof fallback === 'object' && fallback !== null && 'name' in fallback) {
    const name = (fallback as { name?: unknown }).name;
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
