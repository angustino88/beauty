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
  LabsMonitoringEventsRetrieveApiResponse,
  LabsMonitoringEventsExportRetrieveApiResponse,
} from '@/shared/api/generated/api';

const labMonitoringApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLabMonitoringList: builder.query<
      ILabMonitoringResponse,
      ILabMonitoringParams
    >({
      query: (params) => {
        const query = buildQueryString(params);
        return { url: `/api/labs/monitoring-events${query ? `?${query}` : ""}` };
      },
      transformResponse: (response: LabsMonitoringEventsRetrieveApiResponse): ILabMonitoringResponse =>
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
          url: `/api/labs/monitoring-events/export${query ? `?${query}` : ""}`,
        };
      },
      transformResponse: (res: LabsMonitoringEventsExportRetrieveApiResponse) =>
        mapLabMonitoringExportResponse(res),
    }),
  }),
});

export const {
  useGetLabMonitoringListQuery,
  useLazyGetLabMonitoringListQuery,
  useLazyGetLabMonitoringExportQuery,
} = labMonitoringApi;
