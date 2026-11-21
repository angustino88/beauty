import { baseApi } from '@/shared/lib/api';
import { mapImportReport } from './mapper.ts';
import type { ImportMode, ImportReport, ImportReportApi } from './types.ts';

export interface WorkbookUpload {
  file: File;
  mode: ImportMode;
}

const BASE = '/api/labs/workbook-imports';
// An applied import creates or updates rooms, stations, benches and equipment: refresh every list that shows them.
const CHANGED_TAGS = [
  { type: 'Room' as const, id: 'LIST' },
  { type: 'Station' as const, id: 'LIST' },
  { type: 'Bench' as const, id: 'LIST' },
  { type: 'Equipment' as const, id: 'LIST' },
  'Room' as const,
  'Station' as const,
  'Bench' as const,
  'Equipment' as const,
  'ResourceMapping' as const,
  'Downtime' as const,
];

function workbookBody({ file, mode }: WorkbookUpload): FormData {
  const body = new FormData();
  body.append('file', file);
  body.append('mode', mode);
  return body;
}

/** A GET that streams an .xlsx: the browser saves it under the server's file name; the cache keeps `null`. */
function downloadQuery(path: string, fallbackName: string) {
  return {
    url: `${BASE}/${path}`,
    method: 'GET',
    responseHandler: async (response: Response) => {
      if (!response.ok) return response.json().catch(() => null);
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;
      saveBlob(await response.blob(), name);
      return null;
    },
  };
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 100);
}

// Multi-sheet workbook check/apply/export can process thousands of rows in a single transaction;
// give them 3 minutes instead of the default 30-second API timeout.
const WORKBOOK_TIMEOUT_MS = 180_000;

export const workbookImportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    checkWorkbook: build.mutation<ImportReport, WorkbookUpload>({
      query: (upload) => ({
        url: `${BASE}/actions/check`,
        method: 'POST',
        body: workbookBody(upload),
        timeout: WORKBOOK_TIMEOUT_MS,
      }),
      transformResponse: (response: { data: ImportReportApi }) => mapImportReport(response.data),
    }),
    applyWorkbook: build.mutation<ImportReport, WorkbookUpload>({
      query: (upload) => ({
        url: `${BASE}/actions/apply`,
        method: 'POST',
        body: workbookBody(upload),
        timeout: WORKBOOK_TIMEOUT_MS,
      }),
      transformResponse: (response: { data: ImportReportApi }) => mapImportReport(response.data),
      invalidatesTags: CHANGED_TAGS,
    }),
    /** Downloads the empty template (reference sheets filled in). */
    downloadWorkbookTemplate: build.mutation<null, void>({
      query: () => downloadQuery('template', 'labmango-data-template.xlsx'),
    }),
    /** Downloads the current rooms, stations, slots, benches, equipment and placements in the template layout. */
    downloadWorkbookExport: build.mutation<null, void>({
      query: () => ({ ...downloadQuery('export', 'labmango-data-export.xlsx'), timeout: WORKBOOK_TIMEOUT_MS }),
    }),
  }),
});

export const {
  useCheckWorkbookMutation,
  useApplyWorkbookMutation,
  useDownloadWorkbookTemplateMutation,
  useDownloadWorkbookExportMutation,
} = workbookImportApi;
