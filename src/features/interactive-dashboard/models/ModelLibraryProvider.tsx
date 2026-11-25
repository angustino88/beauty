import { type ReactNode } from "react";
import { useVisualModelsQuery } from "./api";
import { LibraryContext } from "./useVisualModel";

export function ModelLibraryProvider({ children }: { children: ReactNode }) {
  const { data = [] } = useVisualModelsQuery();
  return (
    <LibraryContext.Provider value={data}>{children}</LibraryContext.Provider>
  );
}
