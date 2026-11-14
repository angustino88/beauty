import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { sessionFlag } from './session/sessionFlag';

interface AuthState {
  accessToken: string | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  bootstrapStatus: 'loading' | 'authenticated' | 'unauthenticated';
  logging: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  isLoggedIn: false,
  isAuthenticated: false,
  bootstrapStatus: 'loading',
  logging: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isLoggedIn = true;
      state.isAuthenticated = true;
      state.bootstrapStatus = 'authenticated';
      sessionFlag.set();
    },
    setBootstrapStatus: (state, action: PayloadAction<AuthState['bootstrapStatus']>) => {
      state.bootstrapStatus = action.payload;
    },
    setLogging: (state, action: PayloadAction<boolean>) => {
      state.logging = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.accessToken = null;
      state.isLoggedIn = false;
      state.isAuthenticated = false;
      state.bootstrapStatus = 'unauthenticated';
      state.logging = false;
      state.error = null;
      sessionFlag.clear();
    },
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;