import { baseApi } from '@/shared/lib/api';
import { mapImportReport } from './mapper.ts';
import type { ImportReport, ImportReportApi } from './types.ts';

const BASE = '/api/labs/workbook-imports';
// An applied import creates rooms, stations, benches and equipment: refresh every list that shows them.
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

function workbookBody(file: File): FormData {
  const body = new FormData();
  body.append('file', file);
  return body;
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

export const workbookImportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    checkWorkbook: build.mutation<ImportReport, File>({
      query: (file) => ({ url: `${BASE}/actions/check`, method: 'POST', body: workbookBody(file) }),
      transformResponse: (response: { data: ImportReportApi }) => mapImportReport(response.data),
    }),
    applyWorkbook: build.mutation<ImportReport, File>({
      query: (file) => ({ url: `${BASE}/actions/apply`, method: 'POST', body: workbookBody(file) }),
      transformResponse: (response: { data: ImportReportApi }) => mapImportReport(response.data),
      invalidatesTags: CHANGED_TAGS,
    }),
    /** Downloads the template; the file is saved by the browser, the cache only keeps `null`. */
    downloadWorkbookTemplate: build.mutation<null, void>({
      query: () => ({
        url: `${BASE}/template`,
        method: 'GET',
        responseHandler: async (response: Response) => {
          if (!response.ok) return response.json().catch(() => null);
          const disposition = response.headers.get('Content-Disposition') ?? '';
          const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'labmango-data-template.xlsx';
          saveBlob(await response.blob(), name);
          return null;
        },
      }),
    }),
  }),
});

export const { useCheckWorkbookMutation, useApplyWorkbookMutation, useDownloadWorkbookTemplateMutation } =
  workbookImportApi;
