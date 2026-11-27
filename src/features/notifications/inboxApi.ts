import { baseApi } from '@/shared/lib/api';
import { mapInboxItem, type InboxItem, type RawNotificationPayload } from './inboxMapper';

export const inboxApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/notifications — newest first, with is_read for the caller.
    // "All" includes alerts and banners (so users can re-read dismissed banners);
    // "Unread" scopes to one-time alerts so it matches the bell badge count.
    getInbox: build.query<InboxItem[], { unread?: boolean } | void>({
      query: (arg) => ({
        url: '/api/notifications',
        params: {
          page_size: 30,
          ...(arg?.unread ? { unread: 'true', display_mode: 'alert' } : {}),
        },
      }),
      transformResponse: (res: unknown) =>
        ((res as { data?: RawNotificationPayload[] }).data ?? []).map(mapInboxItem),
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),

    // GET /api/notifications?display_mode=banner — active unexpired banners for REST hydration.
    getActiveBanners: build.query<InboxItem[], void>({
      query: () => ({
        url: '/api/notifications',
        params: { display_mode: 'banner', page_size: 25 },
      }),
      transformResponse: (res: unknown) =>
        ((res as { data?: RawNotificationPayload[] }).data ?? []).map(mapInboxItem),
      providesTags: [{ type: 'Notification', id: 'BANNERS' }],
    }),

    // GET /api/notifications/unread-count — the bell badge (one-time alerts only).
    getUnreadCount: build.query<number, void>({
      query: () => ({ url: '/api/notifications/unread-count' }),
      transformResponse: (res: unknown) =>
        (res as { data?: { unread_count?: number } }).data?.unread_count ?? 0,
      providesTags: [{ type: 'Notification', id: 'COUNT' }],
    }),

    // POST /api/notifications/{id}/actions/mark-read — idempotent (alert read or banner dismiss).
    markNotificationRead: build.mutation<void, number>({
      query: (id) => ({ url: `/api/notifications/${id}/actions/mark-read`, method: 'POST' }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
        { type: 'Notification', id: 'BANNERS' },
      ],
    }),

    // POST /api/notifications/actions/mark-all-read — marks unread alerts read (leaves active banners intact).
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
  useGetActiveBannersQuery,
  useGetInboxQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = inboxApi;
