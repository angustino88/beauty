import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
    id:            number;
    type:          string;
    message:       string;
    details?:      string;
    message_type?: string;
    /** In-app path for the primary action (e.g. open a prefilled booking). */
    action_path?:  string;
    created?:      string;
}

interface NotificationState {
    items:       NotificationItem[];
    unreadCount: number;
}

const initialState: NotificationState = { items: [], unreadCount: 0 };

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        pushNotification: (state, action: PayloadAction<NotificationItem>) => {
          const exits = state.items.some((n) => n.id === action.payload.id);
          if (exits) return;  // Prevent duplicates
          state.items.unshift(action.payload);
          state.unreadCount += 1;
        },
        removeNotification: (state, action: PayloadAction<number>) => {  
          state.items = state.items.filter((n) => n.id !== action.payload);
          if (state.unreadCount > 0) state.unreadCount -= 1;
        },
        markAllRead: (state) => { state.unreadCount = 0; },
        clearNotifications: () => initialState,
    },
});

export const notificationActions = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;