import { baseApi } from '@/shared/lib/api';
import { toPurchaseAllocationWire, toPurchaseLineWire, toPurchaseTransactionWire, toPurchaseWire } from './wire.ts';
import type {
  ICreatePurchaseItemPayload,
  ICreatePurchasePayload,
  ICreatePurchaseTransactionPayload,
  IAllocateResourcePayload,
  IPurchase,
  IPurchaseItem,
  IPurchaseItemResource,
  IPurchaseListResponse,
  IPurchasePriority,
  IPurchaseQueryParams,
  IPurchaseTransaction,
  IUpdatePurchaseDraftHeaderPayload,
  IUpdatePurchaseItemPayload,
} from './types';
import {
  mapPurchase,
  mapPurchaseItem,
  mapPurchaseItemListResponse,
  mapPurchaseItemResource,
  mapPurchaseItemResourceListResponse,
  mapPurchaseListResponse,
  mapPurchasePriorityListResponse,
  mapPurchaseTransaction,
  mapPurchaseTransactionListResponse,
} from './mapper';

export const purchaseApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPurchases: build.query<IPurchaseListResponse, IPurchaseQueryParams | void>({
      query: (params) => ({
        url: '/api/labs/purchases',
        params: {
          page: params?.page ?? 1,
          page_size: params?.page_size ?? 10,
        },
      }),
      transformResponse: (res: unknown) => mapPurchaseListResponse(res),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Purchase' as const, id })),
              { type: 'Purchase' as const, id: 'LIST' },
            ]
          : [{ type: 'Purchase' as const, id: 'LIST' }],
    }),

    getPurchaseById: build.query<IPurchase, number>({
      query: (purchaseId) => ({
        url: `/api/labs/purchases/${purchaseId}`,
      }),
      transformResponse: (res: unknown) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapPurchase(envelope);
      },
      providesTags: (_res, _err, purchaseId) => [{ type: 'Purchase', id: purchaseId }],
    }),

    getPurchasePriorities: build.query<IPurchasePriority[], void>({
      query: () => ({
        url: '/api/labs/purchase-priorities',
      }),
      transformResponse: (res: unknown) => mapPurchasePriorityListResponse(res),
    }),

    createPurchase: build.mutation<IPurchase, ICreatePurchasePayload>({
      query: (body) => ({
        url: '/api/labs/purchases',
        method: 'POST',
        body: toPurchaseWire(body),
      }),
      transformResponse: (res: unknown) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapPurchase(envelope);
      },
      invalidatesTags: [
        { type: 'Purchase', id: 'LIST' },
        { type: 'FinanceReport', id: 'SUMMARY' },
      ],
    }),

    updatePurchaseDraftHeader: build.mutation<
      IPurchase,
      { purchaseId: number; body: IUpdatePurchaseDraftHeaderPayload; ifMatch?: string }
    >({
      query: ({ purchaseId, body, ifMatch }) => ({
        url: `/api/labs/purchases/${purchaseId}/draft`,
        method: 'PATCH',
        headers: {
          'If-Match': ifMatch || '*',
        },
        body: toPurchaseWire(body),
      }),
      transformResponse: (res: unknown) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapPurchase(envelope);
      },
      invalidatesTags: (_res, _err, { purchaseId }) => [
        { type: 'Purchase', id: purchaseId },
        { type: 'Purchase', id: 'LIST' },
      ],
    }),

    getPurchaseItems: build.query<
      { data: IPurchaseItem[]; pagination: IPurchaseListResponse['pagination'] },
      { purchaseId: number; page?: number; pageSize?: number }
    >({
      query: ({ purchaseId, page = 1, pageSize = 50 }) => ({
        url: `/api/labs/purchases/${purchaseId}/items`,
        params: { page, page_size: pageSize },
      }),
      transformResponse: (res: unknown) => mapPurchaseItemListResponse(res),
      providesTags: (_res, _err, { purchaseId }) => [
        { type: 'Purchase', id: `items-${purchaseId}` },
      ],
    }),

    createPurchaseItem: build.mutation<
      IPurchaseItem,
      { purchaseId: number; body: ICreatePurchaseItemPayload }
    >({
      query: ({ purchaseId, body }) => ({
        url: `/api/labs/purchases/${purchaseId}/items`,
        method: 'POST',
        body: toPurchaseLineWire(body),
      }),
      transformResponse: (res: unknown) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapPurchaseItem(envelope);
      },
      invalidatesTags: (_res, _err, { purchaseId }) => [
        { type: 'Purchase', id: `items-${purchaseId}` },
        { type: 'Purchase', id: purchaseId },
        { type: 'Purchase', id: 'LIST' },
      ],
    }),

    updatePurchaseItem: build.mutation<
      IPurchaseItem,
      { purchaseId: number; itemId: number; body: IUpdatePurchaseItemPayload; ifMatch?: string }
    >({
      query: ({ purchaseId, itemId, body, ifMatch }) => ({
        url: `/api/labs/purchases/${purchaseId}/items/${itemId}`,
        method: 'PATCH',
        headers: {
          'If-Match': ifMatch || '*',
        },
        body: toPurchaseLineWire(body),
      }),
      transformResponse: (res: unknown) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapPurchaseItem(envelope);
      },
      invalidatesTags: (_res, _err, { purchaseId }) => [
        { type: 'Purchase', id: `items-${purchaseId}` },
        { type: 'Purchase', id: purchaseId },
        { type: 'Purchase', id: 'LIST' },
      ],
    }),

    deletePurchaseItem: build.mutation<
      void,
      { purchaseId: number; itemId: number; ifMatch?: string }
    >({
      query: ({ purchaseId, itemId, ifMatch }) => ({
        url: `/api/labs/purchases/${purchaseId}/items/${itemId}`,
        method: 'DELETE',
        headers: {
          'If-Match': ifMatch || '*',
        },
      }),
      invalidatesTags: (_res, _err, { purchaseId }) => [
        { type: 'Purchase', id: `items-${purchaseId}` },
        { type: 'Purchase', id: purchaseId },
        { type: 'Purchase', id: 'LIST' },
      ],
    }),

    getPurchaseTransactions: build.query<
      { data: IPurchaseTransaction[]; pagination: IPurchaseListResponse['pagination'] },
      { purchaseId: number; page?: number; pageSize?: number }
    >({
      query: ({ purchaseId, page = 1, pageSize = 50 }) => ({
        url: `/api/labs/purchases/${purchaseId}/transactions`,
        params: { page, page_size: pageSize },
      }),
      transformResponse: (res: unknown) => mapPurchaseTransactionListResponse(res),
      providesTags: (_res, _err, { purchaseId }) => [
        { type: 'Purchase', id: `transactions-${purchaseId}` },
      ],
    }),

    createPurchaseTransaction: build.mutation<
      IPurchaseTransaction,
      { purchaseId: number; body: ICreatePurchaseTransactionPayload }
    >({
      query: ({ purchaseId, body }) => ({
        url: `/api/labs/purchases/${purchaseId}/transactions`,
        method: 'POST',
        body: toPurchaseTransactionWire(body),
      }),
      transformResponse: (res: unknown) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapPurchaseTransaction(envelope);
      },
      invalidatesTags: (_res, _err, { purchaseId }) => [
        { type: 'Purchase', id: `transactions-${purchaseId}` },
        { type: 'Purchase', id: purchaseId },
        { type: 'Purchase', id: 'LIST' },
        { type: 'FinanceReport', id: 'SUMMARY' },
      ],
    }),

    getPurchaseItemResources: build.query<
      { data: IPurchaseItemResource[]; pagination: IPurchaseListResponse['pagination'] },
      { purchaseItemId: number; page?: number; pageSize?: number }
    >({
      query: ({ purchaseItemId, page = 1, pageSize = 50 }) => ({
        url: `/api/labs/purchase-items/${purchaseItemId}/resources`,
        params: { page, page_size: pageSize },
      }),
      transformResponse: (res: unknown) => mapPurchaseItemResourceListResponse(res),
      providesTags: (_res, _err, { purchaseItemId }) => [
        { type: 'Purchase', id: `resources-${purchaseItemId}` },
      ],
    }),

    createPurchaseItemResource: build.mutation<
      IPurchaseItemResource,
      { purchaseItemId: number; body: IAllocateResourcePayload }
    >({
      query: ({ purchaseItemId, body }) => ({
        url: `/api/labs/purchase-items/${purchaseItemId}/resources`,
        method: 'POST',
        body: toPurchaseAllocationWire(body),
      }),
      transformResponse: (res: unknown) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapPurchaseItemResource(envelope);
      },
      invalidatesTags: (_res, _err, { purchaseItemId }) => [
        { type: 'Purchase', id: `resources-${purchaseItemId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPurchasesQuery,
  useGetPurchaseByIdQuery,
  useGetPurchasePrioritiesQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseDraftHeaderMutation,
  useGetPurchaseItemsQuery,
  useCreatePurchaseItemMutation,
  useUpdatePurchaseItemMutation,
  useDeletePurchaseItemMutation,
  useGetPurchaseTransactionsQuery,
  useCreatePurchaseTransactionMutation,
  useGetPurchaseItemResourcesQuery,
  useCreatePurchaseItemResourceMutation,
} = purchaseApi;
