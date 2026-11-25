import type { AssignmentFit, VisualModelAsset } from "./api.ts";

/** What the renderer needs: an asset combined with one target's fitting. */
export interface VisualModel {
  /** Identifies the file content; the GLB is loaded and cached once per key. */
  cacheKey: string;
  url: string;
  rotation: number;
  scale: number;
  surface: number;
  offset_x: number;
  offset_y: number;
  offset_z: number;
}

// An asset's file never changes (a new file is a new asset), so its content hash identifies the download.
// Pre-signed storage links change on every list request; keep the first link seen for each file so a
// refetch or a metadata edit never remounts or re-downloads a model.
const stableUrls = new Map<string, string>();
export function assetCacheKey(asset: Pick<VisualModelAsset, "sha256">) {
  return `asset:${asset.sha256}`;
}
function stableUrl(asset: VisualModelAsset) {
  const key = assetCacheKey(asset);
  let url = stableUrls.get(key);
  if (!url) stableUrls.set(key, (url = asset.url));
  return url;
}

export function resolveModel(
  asset: VisualModelAsset,
  fit: Omit<AssignmentFit, "asset_id">,
): VisualModel {
  return {
    cacheKey: assetCacheKey(asset),
    url: stableUrl(asset),
    rotation: asset.rotation + fit.rotation,
    scale: fit.scale,
    surface: asset.surface,
    offset_x: fit.offset_x,
    offset_y: fit.offset_y,
    offset_z: fit.offset_z,
  };
}

export const DEFAULT_FIT: Omit<AssignmentFit, "asset_id"> = {
  rotation: 0,
  scale: 1,
  offset_x: 0,
  offset_y: 0,
  offset_z: 0,
};
