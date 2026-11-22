import type {
  ApiErrorDetail,
  ImportProblem,
  ImportProgress,
  ImportProgressApi,
  ImportProgressPhase,
  ImportProgressStatus,
  ImportReport,
  ImportReportApi,
} from './types.ts';

const PROGRESS_STATUSES = new Set<ImportProgressStatus>(['running', 'completed', 'failed']);
const PROGRESS_PHASES = new Set<ImportProgressPhase>([
  'reading',
  'waiting_lock',
  'processing',
  'finalizing',
  'completed',
  'failed',
]);

export function mapImportProgress(api: ImportProgressApi): ImportProgress {
  const rawStatus = api.status?.value as ImportProgressStatus | undefined;
  const rawPhase = api.phase?.value as ImportProgressPhase | undefined;
  return {
    progressKey: api.progress_key,
    status: rawStatus && PROGRESS_STATUSES.has(rawStatus) ? rawStatus : 'running',
    phase: rawPhase && PROGRESS_PHASES.has(rawPhase) ? rawPhase : 'processing',
    percent: Math.max(0, Math.min(100, Math.round(api.percent ?? 0))),
    currentSheet: api.current_sheet ?? null,
    processedRows: api.processed_rows ?? 0,
    totalRows: api.total_rows ?? 0,
    completedSheets: api.completed_sheets ?? 0,
    totalSheets: api.total_sheets ?? 0,
    message: api.message ?? '',
    updatedAt: api.updated_at,
  };
}

export function mapImportReport(api: ImportReportApi): ImportReport {
  return {
    isDryRun: api.is_dry_run,
    isValid: api.is_valid,
    templateVersion: api.template_version,
    mode: api.mode?.value === 'upsert' ? 'upsert' : 'create',
    summary: {
      created: api.summary.created,
      updated: api.summary.updated ?? 0,
      existing: api.summary.existing,
      errorCount: api.summary.error_count,
      warningCount: api.summary.warning_count,
    },
    sheets: api.sheets.map((sheet) => ({
      key: sheet.key,
      name: sheet.name,
      rows: sheet.rows,
      created: sheet.created,
      updated: sheet.updated ?? 0,
      existing: sheet.existing,
      failed: sheet.failed,
      ignoredColumns: sheet.ignored_columns ?? [],
    })),
    problems: api.problems.map((problem) => ({
      sheet: problem.sheet,
      row: problem.row,
      column: problem.column,
      severity: problem.severity?.value === 'warning' ? 'warning' : 'error',
      code: problem.code,
      message: problem.message,
    })),
    unknownSheets: api.unknown_sheets ?? [],
  };
}

const FIELD_PATH = /^(?<sheet>[^[.]+?)(?:\[(?<row>\d+)\])?(?:\.(?<column>.+))?$/;

/** Turn a 422 detail (`field` = `Sheet[row].Column`) of the apply endpoint into a problem row. */
export function mapApplyErrorDetail(detail: ApiErrorDetail): ImportProblem {
  const match = FIELD_PATH.exec(detail.field ?? '');
  return {
    sheet: match?.groups?.sheet ?? detail.field ?? 'Workbook',
    row: match?.groups?.row ? Number(match.groups.row) : null,
    column: match?.groups?.column ?? null,
    severity: 'error',
    code: detail.code ?? 'invalid',
    message: detail.message ?? 'Invalid value.',
  };
}

/** Problems sorted for reading: errors first, then by sheet order of appearance, row and column. */
export function sortProblems(problems: ImportProblem[], sheetOrder: string[]): ImportProblem[] {
  const order = new Map(sheetOrder.map((name, index) => [name, index]));
  return [...problems].sort((a, b) =>
    (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1)
    || (order.get(a.sheet) ?? 999) - (order.get(b.sheet) ?? 999)
    || (a.row ?? 0) - (b.row ?? 0)
    || (a.column ?? '').localeCompare(b.column ?? ''));
}

/** Problems as CSV text, so a long list can be worked through in Excel. */
export function problemsToCsv(problems: ImportProblem[]): string {
  const quote = (value: unknown) => {
    const text = value == null ? '' : String(value);
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const lines = [['Severity', 'Sheet', 'Row', 'Column', 'Code', 'Message'].map(quote).join(',')];
  for (const p of problems) lines.push([p.severity, p.sheet, p.row, p.column, p.code, p.message].map(quote).join(','));
  return lines.join('\r\n');
}
