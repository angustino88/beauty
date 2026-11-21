export type BootstrapStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface PermissionRouteQueryState {
  isUninitialized: boolean;
  isLoading: boolean;
  isFetching: boolean;
  hasData: boolean;
}

export interface PermissionRouteInput {
  isLoggedIn: boolean;
  bootstrapStatus: BootstrapStatus;
  /** True once `meSlice` holds the current user (`state.me.id !== null`). */
  meLoaded: boolean;
  hasAccess: boolean;
  query: PermissionRouteQueryState;
}

export type PermissionRouteDecision = 'loading' | 'denied' | 'allowed';

/**
 * Decides whether a permission-guarded route should show the initial loading spinner,
 * render `<AccessDenied />`, or keep `{children}` mounted.
 *
 * Once `meLoaded` is true, background refetches (`query.isFetching === true` from
 * `refetchOnFocus` when closing the OS file picker, `refetchOnReconnect`, or route switches)
 * must NOT return `'loading'`, otherwise `{children}` unmounts and open modals/uploads are lost.
 */
export function resolvePermissionRouteState({
  isLoggedIn,
  bootstrapStatus,
  meLoaded,
  hasAccess,
  query,
}: PermissionRouteInput): PermissionRouteDecision {
  if (
    isLoggedIn &&
    (bootstrapStatus === 'loading' ||
      (!meLoaded && (query.isUninitialized || query.isLoading || query.isFetching || query.hasData)))
  ) {
    return 'loading';
  }

  if (!hasAccess) {
    return 'denied';
  }

  return 'allowed';
}
