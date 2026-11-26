import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "@/shared/lib/api";

/** Resources that store a 3D model. Catalog rows hold defaults their items inherit. */
export type ModelSegment =
  | "station-types"
  | "equipment-categories"
  | "equipment-product-models"
  | "stations"
  | "benches"
  | "equipment";

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

export type AssetDetails = Pick<
  VisualModelAsset,
  "name" | "source_url" | "license" | "rotation" | "surface"
>;

/** The model a resource stores and the one it shows after inheriting catalog defaults. */
export interface VisualModelSelection {
  id: number;
  name: string;
  visual_model_id: number | null;
  effective_visual_model_id: number | null;
  /** "own", the catalog the shown model comes from, or null when none applies. */
  origin: "own" | "station_type" | "product_model" | "equipment_category" | null;
}

export {
  assetCacheKey,
  resolveAsset,
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

const visualApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ["VisualModelAsset", "VisualModelSelection"],
  })
  .injectEndpoints({
    endpoints: (build) => ({
      visualModelAssets: build.query<VisualModelAsset[], void>({
        async queryFn(_args, _api, _extra, fetchWithBQ) {
          return fetchAllPages<VisualModelAsset>(fetchWithBQ, assetsUrl);
        },
        providesTags: ["VisualModelAsset"],
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
      visualModelSelection: build.query<
        VisualModelSelection,
        { segment: ModelSegment; id: number }
      >({
        query: ({ segment, id }) => `/api/labs/${segment}/${id}/visual-model`,
        transformResponse: (response: { data: VisualModelSelection }) =>
          response.data,
        providesTags: (_result, _error, { segment, id }) => [
          { type: "VisualModelSelection", id: `${segment}/${id}` },
        ],
      }),
      visualModelSelections: build.query<VisualModelSelection[], ModelSegment>({
        async queryFn(segment, _api, _extra, fetchWithBQ) {
          return fetchAllPages<VisualModelSelection>(
            fetchWithBQ,
            `/api/labs/visual-model-selections/${segment}`,
          );
        },
        providesTags: (_result, _error, segment) => [
          { type: "VisualModelSelection", id: `list:${segment}` },
        ],
      }),
      selectVisualModel: build.mutation<
        VisualModelSelection,
        { segment: ModelSegment; id: number; visualModelId: number | null }
      >({
        query: ({ segment, id, visualModelId }) => ({
          url: `/api/labs/${segment}/${id}/visual-model`,
          method: "PUT",
          body: { visual_model_id: visualModelId },
        }),
        transformResponse: (response: { data: VisualModelSelection }) =>
          response.data,
        // Catalog defaults change what items inherit, so every selection and room layout is refreshed.
        invalidatesTags: ["VisualModelSelection", "VisualModelAsset", "Room"],
      }),
    }),
  });

export const {
  useVisualModelAssetsQuery,
  useUploadVisualModelAssetMutation,
  useUpdateVisualModelAssetMutation,
  useDeleteVisualModelAssetMutation,
  useVisualModelSelectionQuery,
  useVisualModelSelectionsQuery,
  useSelectVisualModelMutation,
} = visualApi;
