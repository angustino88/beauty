import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePermissionRouteState } from './permissionRouteState.ts';

test('shows loading while auth bootstrap or initial /api/users/me fetch is in progress', () => {
  assert.equal(
    resolvePermissionRouteState({
      isLoggedIn: true,
      bootstrapStatus: 'loading',
      meLoaded: false,
      hasAccess: false,
      query: { isUninitialized: true, isLoading: false, isFetching: false, hasData: false },
    }),
    'loading',
  );

  assert.equal(
    resolvePermissionRouteState({
      isLoggedIn: true,
      bootstrapStatus: 'authenticated',
      meLoaded: false,
      hasAccess: false,
      query: { isUninitialized: false, isLoading: true, isFetching: true, hasData: false },
    }),
    'loading',
  );

  // Covers the render frame where RTK Query has data before AppLayout's useEffect dispatches setMe.
  assert.equal(
    resolvePermissionRouteState({
      isLoggedIn: true,
      bootstrapStatus: 'authenticated',
      meLoaded: false,
      hasAccess: false,
      query: { isUninitialized: false, isLoading: false, isFetching: false, hasData: true },
    }),
    'loading',
  );
});

test('keeps children mounted during background refetchOnFocus once me is loaded', () => {
  // Closing the native file picker in WorkbookImportModal focuses the browser window and sets isFetching=true.
  assert.equal(
    resolvePermissionRouteState({
      isLoggedIn: true,
      bootstrapStatus: 'authenticated',
      meLoaded: true,
      hasAccess: true,
      query: { isUninitialized: false, isLoading: false, isFetching: true, hasData: true },
    }),
    'allowed',
  );
});

test('denies access when me is loaded without the required permission, even during background refetch', () => {
  assert.equal(
    resolvePermissionRouteState({
      isLoggedIn: true,
      bootstrapStatus: 'authenticated',
      meLoaded: true,
      hasAccess: false,
      query: { isUninitialized: false, isLoading: false, isFetching: true, hasData: true },
    }),
    'denied',
  );
});

test('falls back to denied instead of spinning forever if initial /api/users/me fails', () => {
  assert.equal(
    resolvePermissionRouteState({
      isLoggedIn: true,
      bootstrapStatus: 'authenticated',
      meLoaded: false,
      hasAccess: false,
      query: { isUninitialized: false, isLoading: false, isFetching: false, hasData: false },
    }),
    'denied',
  );
});
