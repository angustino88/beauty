import { baseApi } from "@/shared/lib/api";
import type { LabSessionLogResponse } from "../types";
import { mapSessionLogResponse } from "../mapper";

export interface LabSessionLogParams {
  page?: number;
  page_size?: number;
  lab_name?: string;
  start_date?: string;
  end_date?: string;
  sorts?: string[];
  orders?: string[];
}

export const analyticsSessionLogApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLabSessionLogs: build.query<LabSessionLogResponse, LabSessionLogParams>({
      query: ({ sorts, orders, ...rest }) => {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(rest)) {
          if (v != null && v !== "") sp.append(k, String(v));
        }
        if (sorts?.length) for (const s of sorts) sp.append("sorts", s);
        if (orders?.length) for (const o of orders) sp.append("orders", o);
        return { url: `/api/labs/lab-sessions/log?${sp.toString()}` };
      },
      transformResponse: (res: unknown) => mapSessionLogResponse(res),
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetLabSessionLogsQuery, useLazyGetLabSessionLogsQuery } =
  analyticsSessionLogApi;
