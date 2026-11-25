import { createContext, useContext } from "react";
import type { ModelScope, VisualModel } from "./api";

/** Resolved models keyed by `scope/target_key`. */
export const LibraryContext = createContext<ReadonlyMap<string, VisualModel>>(
  new Map(),
);
export const targetId = (scope: ModelScope, key: string | number) =>
  scope + "/" + key;

export function useVisualModel(
  scope: ModelScope,
  key: string | number | null | undefined,
) {
  const library = useContext(LibraryContext);
  return key == null ? undefined : library.get(targetId(scope, key));
}
