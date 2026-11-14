/**
 * useFilterDropdownGuard
 *
 * WHY THIS HOOK EXISTS:
 * LabDeviceTable uses a WebSocket to auto-refetch lab data when the server
 * pushes a `monitoring_dashboard` event. However, if the user has a column
 * filter dropdown open, we must NOT refetch — it would close the dropdown
 * mid-interaction and lose the user's pending filter selection.

 * WHY useCallback:
 *   Wrapping the factory in useCallback gives it a stable identity across renders,
 *   which also satisfies the ESLint rule by moving the ref access outside the
 *   render-phase closure.
 *
 * USAGE:
 *   const { makeFilterDropdownHandler, isAnyFilterOpen } = useFilterDropdownGuard();
 *   // In column def:
 *   filterDropdownProps: { onOpenChange: makeFilterDropdownHandler('status') }
 *   // In WS onmessage handler:
 *   if (isAnyFilterOpen()) return;
 */
import { useRef, useCallback } from 'react';

export function useFilterDropdownGuard() {
  const openKeysRef = useRef<Set<string>>(new Set());

  const makeFilterDropdownHandler = useCallback(
    (key: string) => (visible: boolean) => {
      if (visible) {
        openKeysRef.current.add(key);
      } else {
        openKeysRef.current.delete(key);
      }
    },
    []
  );

  const isAnyFilterOpen = useCallback(() => openKeysRef.current.size > 0, []);

  return { makeFilterDropdownHandler, isAnyFilterOpen };
}
