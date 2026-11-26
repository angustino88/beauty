import { useMemo, type ReactNode } from "react";
import { resolveAsset, useVisualModelAssetsQuery } from "./api";
import { LibraryContext } from "./useVisualModel";

export function ModelLibraryProvider({ children }: { children: ReactNode }) {
  const { data: assets } = useVisualModelAssetsQuery();
  const library = useMemo(
    () => new Map((assets ?? []).map((asset) => [asset.id, resolveAsset(asset)])),
    [assets],
  );
  return (
    <LibraryContext.Provider value={library}>{children}</LibraryContext.Provider>
  );
}
