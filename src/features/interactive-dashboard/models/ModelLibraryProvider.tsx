import { useMemo, type ReactNode } from "react";
import {
  resolveModel,
  useVisualModelAssetsQuery,
  useVisualModelAssignmentsQuery,
  type VisualModel,
} from "./api";
import { LibraryContext, targetId } from "./useVisualModel";

export function ModelLibraryProvider({ children }: { children: ReactNode }) {
  const { data: assets } = useVisualModelAssetsQuery();
  const { data: assignments } = useVisualModelAssignmentsQuery();
  const library = useMemo(() => {
    const byId = new Map((assets ?? []).map((asset) => [asset.id, asset]));
    const resolved = new Map<string, VisualModel>();
    for (const assignment of assignments ?? []) {
      const asset = byId.get(assignment.asset_id);
      if (asset)
        resolved.set(
          targetId(assignment.scope, assignment.target_key),
          resolveModel(asset, assignment),
        );
    }
    return resolved;
  }, [assets, assignments]);
  return (
    <LibraryContext.Provider value={library}>
      {children}
    </LibraryContext.Provider>
  );
}
