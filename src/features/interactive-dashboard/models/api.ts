import { baseApi } from "@/shared/lib/api";

export type ModelScope =
  | "station_type"
  | "equipment_category"
  | "equipment_model"
  | "equipment"
  | "bench";
export interface VisualModel {
  scope: ModelScope;
  target_key: string;
  name: string;
  url: string;
  rotation: number;
  scale: number;
  surface: number;
  offset_x: number;
  offset_y: number;
  offset_z: number;
  source_url: string;
  license: string;
  version: number;
}
const visualApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["VisualModel"] })
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
      visualModels: build.query<VisualModel[], void>({
        async queryFn(_args, _api, _extra, fetchWithBQ) {
          const models: VisualModel[] = [];
          for (let page = 1; ; page++) {
            const response = await fetchWithBQ({
              url: "/api/labs/visual-models",
              params: { page, page_size: 100 },
            });
            if (response.error) return { error: response.error };
            const batch = response.data as {
              data: VisualModel[];
              meta: { pagination: { count: number } };
            };
            models.push(...batch.data);
            if (
              !batch.data.length ||
              models.length >= batch.meta.pagination.count
            )
              return { data: models };
          }
        },
        providesTags: ["VisualModel"],
      }),
      saveVisualModel: build.mutation<
        VisualModel,
        { scope: ModelScope; key: string; body: FormData; version: number }
      >({
        query: ({ scope, key, body, version }) => ({
          url: `/api/labs/visual-models/${scope}/${encodeURIComponent(key)}`,
          method: "PUT",
          headers: version
            ? { "If-Match": `"${version}"` }
            : { "If-None-Match": "*" },
          body,
        }),
        transformResponse: (response: { data: VisualModel }) => response.data,
        invalidatesTags: ["VisualModel"],
      }),
      removeVisualModel: build.mutation<void, VisualModel>({
        query: (model) => ({
          url: `/api/labs/visual-models/${model.scope}/${encodeURIComponent(model.target_key)}`,
          method: "DELETE",
          headers: { "If-Match": `"${model.version}"` },
        }),
        invalidatesTags: ["VisualModel"],
      }),
    }),
  });
export const {
  useVisualModelsQuery,
  useVisualCatalogTargetsQuery,
  useSaveVisualModelMutation,
  useRemoveVisualModelMutation,
} = visualApi;
