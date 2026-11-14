import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface MePermissions {
  [codename: string]: boolean;
}

export interface MePermissionGroups {
  [groupName: string]: boolean;
}

interface MeState {
  id: number | null;
  username: string;
  displayName: string;
  avatar: string | null;
  permissions: MePermissions;
  permissionGroups: MePermissionGroups;
}

const initialState: MeState = {
  id: null,
  username: '',
  displayName: '',
  avatar: null,
  permissions: {},
  permissionGroups: {},
};

export interface EffectiveRoles {
  labs: string[];
}

/**
 * Builds the lab role map from the authoritative effective_roles.labs values
 * returned by /api/users/me. Group membership is not an effective permission.
 */
export function flattenEffectiveRoles(effectiveRoles?: EffectiveRoles | null): {
  permissions: MePermissions;
  permissionGroups: MePermissionGroups;
} {
  const permissions: MePermissions = {};
  const permissionGroups: MePermissionGroups = {};

  if (!effectiveRoles || !Array.isArray(effectiveRoles.labs)) {
    return { permissions, permissionGroups };
  }

  for (const rawRole of effectiveRoles.labs) {
    if (typeof rawRole !== 'string' || !rawRole.trim()) continue;

    const trimmed = rawRole.trim();
    const slug = trimmed.toLowerCase().replace(/[\s_]+/g, '-');
    permissionGroups[trimmed] = true;
    permissionGroups[slug] = true;

    if (slug === 'admin' || slug === 'administrator') {
      permissionGroups.admin = true;
      permissionGroups.administrator = true;
    }
    if (slug === 'lab-coordinator' || slug === 'coordinator') {
      permissionGroups['lab-coordinator'] = true;
      permissionGroups.coordinator = true;
    }
  }

  return { permissions, permissionGroups };
}

const meSlice = createSlice({
  name: 'me',
  initialState,
  reducers: {
    setMe: (state, action: PayloadAction<Omit<MeState, 'permissions' | 'permissionGroups'> & {
      permissions: MePermissions;
      permissionGroups: MePermissionGroups;
    }>) => {
      return { ...state, ...action.payload };
    },
    clearMe: () => initialState,
    setAvatar: (state, action: PayloadAction<string | null>) => {
      state.avatar = action.payload;
    },
  },
});

export const meActions = meSlice.actions;
export const meReducer = meSlice.reducer;
