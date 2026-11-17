import { baseApi } from "@/shared/lib/api";
import type { LabSessionLogResponse } from "../types";
import { mapSessionLogResponse } from "../mapper";

/** Filters of GET /api/labs/lab-sessions. The login-day range is required (at most 366 days). */
export interface LabSessionLogParams {
  start_date: string;
  end_date: string;
  page?: number;
  page_size?: number;
  bench_id?: number;
  access_type?: string;
  q?: string;
  ordering?: string;
}

export const analyticsSessionLogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLabSessionLogs: build.query<LabSessionLogResponse, LabSessionLogParams>({
      query: (params) => ({
        url: "/api/labs/lab-sessions",
        params: Object.fromEntries(Object.entries(params).filter(([, value]) => value != null && value !== "")),
      }),
      transformResponse: (res: unknown) => mapSessionLogResponse(res),
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetLabSessionLogsQuery, useLazyGetLabSessionLogsQuery } = analyticsSessionLogApi;
