import type { VisualModelAsset } from "./api.ts";

/** What the renderer needs to place one library model. */
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

/** Placement comes from the asset; the renderer fits it into each resource's box. */
export function resolveAsset(asset: VisualModelAsset): VisualModel {
  return {
    cacheKey: assetCacheKey(asset),
    url: stableUrl(asset),
    rotation: asset.rotation,
    scale: 1,
    surface: asset.surface,
    offset_x: 0,
    offset_y: 0,
    offset_z: 0,
  };
}
