export type ProblemSeverity = 'error' | 'warning';

/**
 * `create`: every asset tag must be new (an existing one is an error).
 * `upsert`: a row whose asset tag exists updates that record; blank cells keep stored values.
 * The asset tag (SKU) itself is never changed.
 */
export type ImportMode = 'create' | 'upsert';

export interface ImportProblem {
  sheet: string;
  row: number | null;
  column: string | null;
  severity: ProblemSeverity;
  code: string;
  message: string;
}

export interface ImportSheetOutcome {
  key: string;
  name: string;
  rows: number;
  created: number;
  updated: number;
  /** Rows that match a stored record and change nothing (reference rows; unchanged rows in update mode). */
  existing: number;
  failed: number;
  ignoredColumns: string[];
}

export interface ImportReport {
  isDryRun: boolean;
  isValid: boolean;
  templateVersion: string | null;
  mode: ImportMode;
  summary: { created: number; updated: number; existing: number; errorCount: number; warningCount: number };
  sheets: ImportSheetOutcome[];
  problems: ImportProblem[];
  unknownSheets: string[];
}

/** Wire shapes of `/api/labs/workbook-imports/actions/*` (see openapi/labs-workbook-import.yml). */
export interface ImportReportApi {
  is_dry_run: boolean;
  is_valid: boolean;
  template_version: string | null;
  /** Absent from servers older than the update mode. */
  mode?: { value: string; label: string } | null;
  summary: { created: number; updated?: number; existing: number; error_count: number; warning_count: number };
  sheets: Array<{
    key: string;
    name: string;
    rows: number;
    created: number;
    updated?: number;
    existing: number;
    failed: number;
    ignored_columns: string[];
  }>;
  problems: Array<{
    sheet: string;
    row: number | null;
    column: string | null;
    severity: { value: string; label: string } | null;
    code: string;
    message: string;
  }>;
  unknown_sheets: string[];
}

export type ImportProgressStatus = 'running' | 'completed' | 'failed';
export type ImportProgressPhase =
  | 'reading'
  | 'waiting_lock'
  | 'processing'
  | 'finalizing'
  | 'completed'
  | 'failed';

export interface ImportProgress {
  progressKey: string;
  status: ImportProgressStatus;
  phase: ImportProgressPhase;
  percent: number;
  currentSheet: string | null;
  processedRows: number;
  totalRows: number;
  completedSheets: number;
  totalSheets: number;
  message: string;
  updatedAt: string;
}

export interface ImportProgressApi {
  progress_key: string;
  status: { value: string; label: string } | null;
  phase: { value: string; label: string } | null;
  percent: number;
  current_sheet: string | null;
  processed_rows: number;
  total_rows: number;
  completed_sheets: number;
  total_sheets: number;
  message: string;
  updated_at: string;
}

export interface ApiErrorDetail {
  field?: string | null;
  code?: string;
  message?: string;
}
