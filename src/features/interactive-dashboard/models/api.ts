import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "@/shared/lib/api";

export type ModelScope =
  | "station_type"
  | "equipment_category"
  | "equipment_model"
  | "equipment"
  | "bench";

/** A GLB in the shared library, uploaded once and reused by many resources. */
export interface VisualModelAsset {
  id: number;
  name: string;
  url: string;
  sha256: string;
  size: number;
  source_url: string;
  license: string;
  rotation: number;
  surface: number;
  usage_count: number;
  version: number;
  updated_at: string;
}

/** Maps one catalog type or resource to a library asset, with per-target fitting. */
export interface VisualModelAssignment {
  scope: ModelScope;
  target_key: string;
  asset_id: number;
  rotation: number;
  scale: number;
  offset_x: number;
  offset_y: number;
  offset_z: number;
  version: number;
}

export type AssetDetails = Pick<
  VisualModelAsset,
  "name" | "source_url" | "license" | "rotation" | "surface"
>;
export type AssignmentFit = Pick<
  VisualModelAssignment,
  "asset_id" | "rotation" | "scale" | "offset_x" | "offset_y" | "offset_z"
>;

export {
  assetCacheKey,
  DEFAULT_FIT,
  resolveModel,
  type VisualModel,
} from "./resolve.ts";

type Page<T> = { data: T[]; meta: { pagination: { count: number } } };
type PageResult = { data?: unknown; error?: FetchBaseQueryError };
async function fetchAllPages<T>(
  fetchWithBQ: (arg: {
    url: string;
    params: Record<string, number>;
  }) => PageResult | PromiseLike<PageResult>,
  url: string,
): Promise<{ data: T[] } | { error: FetchBaseQueryError }> {
  const rows: T[] = [];
  for (let page = 1; ; page++) {
    const response = await fetchWithBQ({
      url,
      params: { page, page_size: 100 },
    });
    if (response.error) return { error: response.error };
    const batch = response.data as Page<T>;
    rows.push(...batch.data);
    if (!batch.data.length || rows.length >= batch.meta.pagination.count)
      return { data: rows };
  }
}

const ifVersion = (version: number) => ({ "If-Match": `"${version}"` });
const assetsUrl = "/api/labs/visual-model-assets";
const assignmentUrl = (scope: ModelScope, key: string) =>
  `/api/labs/visual-model-assignments/${scope}/${encodeURIComponent(key)}`;

const visualApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ["VisualModelAsset", "VisualModelAssignment"],
  })
  .injectEndpoints({
    endpoints: (build) => ({
      visualCatalogTargets: build.query<
        { scope: ModelScope; key: string; label: string }[],
        void
      >({
        async queryFn(_args, _api, _extra, fetchWithBQ) {
          const sources = [
            {
              scope: "station_type" as const,
              label: "Station type",
              url: "/api/labs/station-types/options",
            },
            {
              scope: "equipment_category" as const,
              label: "Category",
              url: "/api/labs/equipment-categories/options",
            },
          ];
          const responses = await Promise.all(
            sources.map((source) => fetchWithBQ(source.url)),
          );
          const targets: { scope: ModelScope; key: string; label: string }[] =
            [];
          for (const [index, response] of responses.entries()) {
            if (response.error) return { error: response.error };
            const { data } = response.data as {
              data: { id: number; name: string }[];
            };
            targets.push(
              ...data.map((item) => ({
                scope: sources[index].scope,
                key: String(item.id),
                label: sources[index].label + " · " + item.name,
              })),
            );
          }
          return { data: targets };
        },
      }),
      visualModelAssets: build.query<VisualModelAsset[], void>({
        async queryFn(_args, _api, _extra, fetchWithBQ) {
          return fetchAllPages<VisualModelAsset>(fetchWithBQ, assetsUrl);
        },
        providesTags: ["VisualModelAsset"],
      }),
      visualModelAssignments: build.query<VisualModelAssignment[], void>({
        async queryFn(_args, _api, _extra, fetchWithBQ) {
          return fetchAllPages<VisualModelAssignment>(
            fetchWithBQ,
            "/api/labs/visual-model-assignments",
          );
        },
        providesTags: ["VisualModelAssignment"],
      }),
      uploadVisualModelAsset: build.mutation<
        { asset: VisualModelAsset; created: boolean },
        FormData
      >({
        query: (body) => ({ url: assetsUrl, method: "POST", body }),
        transformResponse: (response: { data: VisualModelAsset }, meta) => ({
          asset: response.data,
          created:
            (meta as { response?: Response } | undefined)?.response?.status !==
            200,
        }),
        invalidatesTags: ["VisualModelAsset"],
      }),
      updateVisualModelAsset: build.mutation<
        VisualModelAsset,
        { asset: VisualModelAsset; details: AssetDetails }
      >({
        query: ({ asset, details }) => ({
          url: `${assetsUrl}/${asset.id}`,
          method: "PUT",
          headers: ifVersion(asset.version),
          body: details,
        }),
        transformResponse: (response: { data: VisualModelAsset }) =>
          response.data,
        invalidatesTags: ["VisualModelAsset"],
      }),
      deleteVisualModelAsset: build.mutation<void, VisualModelAsset>({
        query: (asset) => ({
          url: `${assetsUrl}/${asset.id}`,
          method: "DELETE",
          headers: ifVersion(asset.version),
        }),
        invalidatesTags: ["VisualModelAsset"],
      }),
      assignVisualModel: build.mutation<
        VisualModelAssignment,
        { scope: ModelScope; key: string; fit: AssignmentFit; version: number }
      >({
        query: ({ scope, key, fit, version }) => ({
          url: assignmentUrl(scope, key),
          method: "PUT",
          headers: version ? ifVersion(version) : { "If-None-Match": "*" },
          body: fit,
        }),
        transformResponse: (response: { data: VisualModelAssignment }) =>
          response.data,
        // Usage counts on assets change with assignments.
        invalidatesTags: ["VisualModelAssignment", "VisualModelAsset"],
      }),
      unassignVisualModel: build.mutation<void, VisualModelAssignment>({
        query: (assignment) => ({
          url: assignmentUrl(assignment.scope, assignment.target_key),
          method: "DELETE",
          headers: ifVersion(assignment.version),
        }),
        invalidatesTags: ["VisualModelAssignment", "VisualModelAsset"],
      }),
    }),
  });

export const {
  useVisualCatalogTargetsQuery,
  useVisualModelAssetsQuery,
  useVisualModelAssignmentsQuery,
  useUploadVisualModelAssetMutation,
  useUpdateVisualModelAssetMutation,
  useDeleteVisualModelAssetMutation,
  useAssignVisualModelMutation,
  useUnassignVisualModelMutation,
} = visualApi;
