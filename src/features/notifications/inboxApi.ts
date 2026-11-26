import { baseApi } from '@/shared/lib/api';
import { mapInboxItem, type InboxItem } from './inboxMapper';

type Raw = Parameters<typeof mapInboxItem>[0];

export const inboxApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/notifications — newest first, with is_read for the caller
    getInbox: build.query<InboxItem[], { unread?: boolean } | void>({
      query: (arg) => ({
        url: '/api/notifications',
        params: { page_size: 30, ...(arg?.unread ? { unread: 'true' } : {}) },
      }),
      transformResponse: (res: unknown) => ((res as { data?: Raw[] }).data ?? []).map(mapInboxItem),
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    // GET /api/notifications/unread-count — the bell badge
    getUnreadCount: build.query<number, void>({
      query: () => ({ url: '/api/notifications/unread-count' }),
      transformResponse: (res: unknown) => (res as { data?: { unread_count?: number } }).data?.unread_count ?? 0,
      providesTags: [{ type: 'Notification', id: 'COUNT' }],
    }),

    // POST /api/notifications/{id}/actions/mark-read — idempotent
    markNotificationRead: build.mutation<void, number>({
      query: (id) => ({ url: `/api/notifications/${id}/actions/mark-read`, method: 'POST' }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
      ],
    }),

    // POST /api/notifications/actions/mark-all-read
    markAllNotificationsRead: build.mutation<void, void>({
      query: () => ({ url: '/api/notifications/actions/mark-all-read', method: 'POST' }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInboxQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = inboxApi;
