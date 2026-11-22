import { useState, useCallback, useMemo } from 'react';
import type { TableProps } from 'antd';
import { confirmAction, getApiErrorMessage, notify } from '@/shared/notifications';
import {
  useGetBenchBookingsQuery,
  useApproveBenchBookingMutation,
  useRejectBenchBookingMutation,
} from '../api';
import type { IBenchBookingListParams, BenchBookingItem } from '../types';

export interface MyBookingTableState {
  currentPage: number;
  pageSize: number;
  filterParams: Record<string, string[]>;
  orders: string[];
  sorts: string[];
}

export function useMyBookingTable(
  search: string,
  user: { id?: number | null; username?: string } | null,
  canSeeAll = false,
) {
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterParams, setFilterParams] = useState<Record<string, string[]>>({});
  const [sorts, setSorts] = useState<string[]>([]);
  const [orders, setOrders] = useState<string[]>([]);

  const [approveBooking] = useApproveBenchBookingMutation();
  const [rejectBooking] = useRejectBenchBookingMutation();
  const currentUsername = user?.username;
  const currentUserId = user?.id;
  const isShowingAll = canSeeAll && showAll;

  const queryParams = useMemo<IBenchBookingListParams>(() => {
    const params: IBenchBookingListParams = {
      view_side: isShowingAll ? undefined : 'my_booking',
      page: currentPage,
      page_size: pageSize,
      filterParams,
      sorts: sorts.length ? sorts : ['id'],
      orders: sorts.length ? orders : ['desc'],
    };
    if (search.trim()) params.q = search.trim();
    if (!isShowingAll && currentUserId != null) {
      params.creator_id = currentUserId;
    }
    return params;
  }, [currentPage, pageSize, filterParams, sorts, orders, search, isShowingAll, currentUserId]);

  const { data, isFetching, refetch } = useGetBenchBookingsQuery(queryParams);

  const bookings: BenchBookingItem[] = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((item) => {
      if (item.creator?.username) return item;
      if (!showAll && currentUsername) {
        return {
          ...item,
          creator: {
            id: user?.id ?? 0,
            username: currentUsername,
            display_name: currentUsername,
          },
        };
      }
      return item;
    });
  }, [data, showAll, currentUsername, user?.id]);

  const totalCount: number = data?.total_count ?? 0;

  const handleTableChange: NonNullable<TableProps<BenchBookingItem>['onChange']> = useCallback(
    (pagination, filters, sorter) => {
      if (pagination.current) setCurrentPage(pagination.current);
      if (pagination.pageSize) setPageSize(pagination.pageSize);

      const nextFilterParams: Record<string, string[]> = {};
      for (const [key, values] of Object.entries(filters)) {
        if (values && values.length > 0) {
          nextFilterParams[key] = values.map(String);
        }
      }
      setFilterParams(nextFilterParams);

      const sorters = Array.isArray(sorter) ? sorter : [sorter];
      const nextSorts: string[] = [];
      const nextOrders: string[] = [];
      for (const s of sorters) {
        if (s.order && s.field) {
          const field = Array.isArray(s.field) ? s.field.join('.') : String(s.field);
          nextSorts.push(field);
          nextOrders.push(s.order === 'ascend' ? 'asc' : 'desc');
        }
      }
      setSorts(nextSorts);
      setOrders(nextOrders);
    },
    [],
  );

  const handleToggleShowAll = useCallback((value: boolean) => {
    setShowAll(value);
    setCurrentPage(1);
  }, []);

  const handleApproveBooking = useCallback(
    (bookingId: number) => {
      confirmAction({
        title: 'Approve booking',
        description: 'Confirm approval for this bench booking request?',
        confirmText: 'Approve',
        cancelText: 'Cancel',
        variant: 'default',
        onConfirm: async () => {
          try {
            await approveBooking({
              id: bookingId,
              idempotencyKey: crypto.randomUUID(),
            }).unwrap();
            void refetch();
            notify.success('Booking approved');
          } catch (error) {
            notify.error('Unable to approve booking', {
              description: getApiErrorMessage(error, 'Please try again.'),
            });
          }
        },
      });
    },
    [approveBooking, refetch],
  );

  const handleRejectBooking = useCallback(
    (bookingId: number) => {
      confirmAction({
        title: 'Reject booking',
        description: 'Are you sure you want to reject this booking request? The requester will be notified.',
        confirmText: 'Reject',
        cancelText: 'Cancel',
        variant: 'danger',
        onConfirm: async () => {
          try {
            await rejectBooking({
              id: bookingId,
              idempotencyKey: crypto.randomUUID(),
              reason: 'Rejected by coordinator',
            }).unwrap();
            void refetch();
            notify.success('Booking rejected');
          } catch (error) {
            notify.error('Unable to reject booking', {
              description: getApiErrorMessage(error, 'Please try again.'),
            });
          }
        },
      });
    },
    [rejectBooking, refetch],
  );

  const resetFilters = useCallback(() => {
    setCurrentPage(1);
    setFilterParams({});
    setSorts([]);
    setOrders([]);
    void refetch();
  }, [refetch]);

  return {
    bookings,
    totalCount,
    isFetching,
    currentPage,
    pageSize,
    showAll,
    filterParams,
    handleTableChange,
    handleToggleShowAll,
    handleApproveBooking,
    handleRejectBooking,
    resetFilters,
    refetch,
  };
}
