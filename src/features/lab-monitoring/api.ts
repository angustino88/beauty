import { baseApi } from "@/shared/lib/api";
import {
  buildQueryString,
} from "@/shared/lib/api/endpointHelpers";
import type {
  ILabMonitoringParams,
  ILabMonitoringResponse,
} from "./types";
import { mapLabMonitoringExportResponse, mapLabMonitoringListResponse } from './mapper';
import type {
  LabsLabMonitoringRetrieveApiResponse,
  LabsLabMonitoringExportRetrieveApiResponse,
} from '@/shared/api/generated/api';

const labMonitoringApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLabMonitoringList: builder.query<
      ILabMonitoringResponse,
      ILabMonitoringParams
    >({
      query: (params) => {
        const query = buildQueryString(params);
        return { url: `/api/labs/lab-monitoring${query ? `?${query}` : ""}` };
      },
      transformResponse: (response: LabsLabMonitoringRetrieveApiResponse): ILabMonitoringResponse =>
        mapLabMonitoringListResponse(response),
      providesTags: ["Monitoring"],
    }),

    getLabMonitoringExport: builder.query<
      ILabMonitoringResponse,
      Omit<ILabMonitoringParams, "page" | "page_size">
    >({
      query: (params) => {
        const query = buildQueryString(params);
        return {
          url: `/api/labs/lab-monitoring/export${query ? `?${query}` : ""}`,
        };
      },
      transformResponse: (res: LabsLabMonitoringExportRetrieveApiResponse) =>
        mapLabMonitoringExportResponse(res),
    }),
  }),
});

export const {
  useGetLabMonitoringListQuery,
  useLazyGetLabMonitoringListQuery,
  useLazyGetLabMonitoringExportQuery,
} = labMonitoringApi;
