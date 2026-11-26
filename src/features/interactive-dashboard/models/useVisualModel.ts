import { createContext, useContext } from "react";
import type { VisualModel } from "./api";

/** Library models by asset id. The dashboard only displays: resources say which asset they show. */
export const LibraryContext = createContext<ReadonlyMap<number, VisualModel>>(
  new Map(),
);

export function useVisualModel(assetId: number | null | undefined) {
  const library = useContext(LibraryContext);
  return assetId == null ? undefined : library.get(assetId);
}
