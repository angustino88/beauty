import { useMemo } from "react";
import { Link } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import type { FieldConfig } from "@/features/lab-equipment/shared";
import {
  useSelectVisualModelMutation,
  useVisualModelAssetsQuery,
  useVisualModelSelectionQuery,
  type ModelSegment,
} from "./api";

const ORIGIN_LABELS = {
  station_type: "station type",
  product_model: "product model",
  equipment_category: "equipment category",
} as const;

/**
 * The "3D model" field of a resource's edit form. The value is stored on the resource itself; leaving it
 * empty shows the catalog default (station type, product model or category) on the 3D dashboard.
 */
export function useVisualModelField(segment: ModelSegment, id: number | null) {
  const assets = useVisualModelAssetsQuery(id == null ? skipToken : undefined);
  const selection = useVisualModelSelectionQuery(
    id == null ? skipToken : { segment, id },
  );
  const [select] = useSelectVisualModelMutation();
  const current = selection.currentData;

  const field = useMemo<FieldConfig | null>(() => {
    if (id == null) return null;
    const byId = new Map((assets.data ?? []).map((asset) => [asset.id, asset]));
    const inherited =
      current && current.origin && current.origin !== "own"
        ? byId.get(current.effective_visual_model_id ?? -1)
        : undefined;
    return {
      name: "visual_model_id",
      label: "3D model",
      type: "select",
      span: 24,
      section: "Layout",
      loading: assets.isFetching || selection.isFetching,
      options: (assets.data ?? []).map((asset) => ({
        label: asset.name,
        value: asset.id,
      })),
      placeholder:
        inherited && current?.origin && current.origin !== "own"
          ? `Default: ${inherited.name} (from ${ORIGIN_LABELS[current.origin]})`
          : "None: shows the built-in shape",
      help: (
        <>
          Shown on the 3D dashboard. Leave empty to use the catalog default.{" "}
          <Link to="/spaces/3d-models">Manage 3D models</Link>
        </>
      ),
    };
  }, [assets.data, assets.isFetching, current, id, selection.isFetching]);

  return {
    field,
    /** Form initial value: the model stored on this resource. */
    value: current?.visual_model_id ?? undefined,
    /** Store the form's choice when it changed. */
    async save(resourceId: number, raw: unknown) {
      const next = raw == null || raw === "" ? null : Number(raw);
      const stored = resourceId === id ? (current?.visual_model_id ?? null) : null;
      if (next === stored) return;
      await select({ segment, id: resourceId, visualModelId: next }).unwrap();
    },
  };
}
