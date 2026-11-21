import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { permissionSetFrom, type PermissionSet } from './permissions.ts';

interface MeState {
  id: number | null;
  username: string;
  displayName: string;
  avatar: string | null;
  /** Labs permission codes the user holds (`effective_permissions.labs`). Check with `useCan`. */
  permissions: PermissionSet;
  /** Labs role codes (`admin`, `coord`, `member`), for display only. Never gate an action on a role. */
  roles: string[];
}

const initialState: MeState = {
  id: null,
  username: '',
  displayName: '',
  avatar: null,
  permissions: {},
  roles: [],
};

/** The subset of `GET /api/users/me` the slice reads. */
export interface MeUser {
  id: number;
  username: string;
  display_name?: string;
  avatar_url: string | null;
  effective_roles?: { labs?: string[] } | null;
  effective_permissions?: { labs?: ReadonlyArray<{ value?: unknown } | string> | null } | null;
}

/** Builds the slice payload from `GET /api/users/me`. */
export function meFromUser(user: MeUser): MeState {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name ?? '',
    avatar: user.avatar_url,
    permissions: permissionSetFrom(user.effective_permissions),
    roles: Array.isArray(user.effective_roles?.labs) ? [...user.effective_roles.labs] : [],
  };
}

const meSlice = createSlice({
  name: 'me',
  initialState,
  reducers: {
    setMe: (state, action: PayloadAction<MeState>) => ({ ...state, ...action.payload }),
    clearMe: () => initialState,
    setAvatar: (state, action: PayloadAction<string | null>) => {
      state.avatar = action.payload;
    },
  },
});

export const meActions = meSlice.actions;
export const meReducer = meSlice.reducer;
