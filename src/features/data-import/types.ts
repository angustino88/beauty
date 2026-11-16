export type ProblemSeverity = 'error' | 'warning';

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
  existing: number;
  failed: number;
  ignoredColumns: string[];
}

export interface ImportReport {
  isDryRun: boolean;
  isValid: boolean;
  templateVersion: string | null;
  summary: { created: number; existing: number; errorCount: number; warningCount: number };
  sheets: ImportSheetOutcome[];
  problems: ImportProblem[];
  unknownSheets: string[];
}

/** Wire shapes of `/api/labs/workbook-imports/actions/*` (see openapi/labs-workbook-import.yml). */
export interface ImportReportApi {
  is_dry_run: boolean;
  is_valid: boolean;
  template_version: string | null;
  summary: { created: number; existing: number; error_count: number; warning_count: number };
  sheets: Array<{
    key: string;
    name: string;
    rows: number;
    created: number;
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

export interface ApiErrorDetail {
  field?: string | null;
  code?: string;
  message?: string;
}
