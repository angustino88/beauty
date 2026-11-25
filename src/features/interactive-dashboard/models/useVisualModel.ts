import { createContext, useContext } from "react";
import type { ModelScope, VisualModel } from "./api";
export const LibraryContext = createContext<VisualModel[]>([]);
export function useVisualModel(
  scope: ModelScope,
  key: string | number | null | undefined,
) {
  const library = useContext(LibraryContext);
  return library.find(
    (model) => model.scope === scope && model.target_key === String(key),
  );
}
