import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { sortBanners } from './inboxMapper';

export interface NotificationItem {
  id: number;
  type: string;
  message: string;
  details?: string;
  message_type?: string;
  is_dismissible: boolean;
  expires_at?: string | null;
  /** In-app path for the primary action (e.g. open a prefilled booking). */
  action_path?: string;
  created?: string;
}

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
}

const initialState: NotificationState = { items: [], unreadCount: 0 };

const isExpired = (expiresAt: string | null | undefined, nowMs: number): boolean => {
  if (!expiresAt) return false;
  const ms = Date.parse(expiresAt);
  return !Number.isNaN(ms) && ms <= nowMs;
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    hydrateBanners: (state, action: PayloadAction<NotificationItem[]>) => {
      const nowMs = Date.now();
      const active = action.payload.filter((item) => !isExpired(item.expires_at, nowMs));
      state.items = sortBanners(active);
      state.unreadCount = state.items.length;
    },
    upsertBanner: (state, action: PayloadAction<NotificationItem>) => {
      const incoming = action.payload;
      if (isExpired(incoming.expires_at, Date.now())) {
        state.items = state.items.filter((n) => n.id !== incoming.id);
        state.unreadCount = state.items.length;
        return;
      }
      const index = state.items.findIndex((n) => n.id === incoming.id);
      const next =
        index === -1
          ? [incoming, ...state.items]
          : state.items.map((n) => (n.id === incoming.id ? incoming : n));
      state.items = sortBanners(next);
      state.unreadCount = state.items.length;
    },
    removeNotification: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((n) => n.id !== action.payload);
      state.unreadCount = state.items.length;
    },
    pruneExpiredBanners: (state, action: PayloadAction<number | undefined>) => {
      const nowMs = action.payload ?? Date.now();
      const next = state.items.filter((n) => !isExpired(n.expires_at, nowMs));
      if (next.length !== state.items.length) {
        state.items = next;
        state.unreadCount = next.length;
      }
    },
    clearDismissibleBanners: (state) => {
      state.items = state.items.filter((n) => !n.is_dismissible);
      state.unreadCount = state.items.length;
    },
    markAllRead: (state) => {
      state.unreadCount = 0;
    },
    clearNotifications: () => initialState,
  },
});

export const notificationActions = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;