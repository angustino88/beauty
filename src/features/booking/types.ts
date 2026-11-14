import type { Dayjs } from 'dayjs';

export type BenchBookingViewSide = 'booking_calendar' | 'my_booking';

export type BenchBookingStatus =
  | 'reserved'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | string;

export type BenchBookingApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | string;

export interface IBenchBookingListParams {
  view_side?: BenchBookingViewSide;
  bench_id?: number[];
  booking_code?: string;
  creator?: string;
  creator_id?: number;
  project_id?: number;
  q?: string;
  status?: BenchBookingStatus | string;
  approval_status?: BenchBookingApprovalStatus | string;
  orders?: string[];
  sorts?: string[];
  starts_at_after?: string;
  starts_at_before?: string;
  starts_at?: string;
  ends_at?: string;
  search?: string;
  page?: number;
  page_size?: number;
  filterParams?: Record<string, string[]>;
}

export interface IBenchOption {
  label: string;
  value: number;
  sku?: string | null;
}

export interface IProjectOption {
  label: string;
  value: number;
  code?: string | null;
}

export interface IBenchBookingFormValues {
  bench_id?: number | null;
  project_id?: number | null;
  reason?: string;
  starts_at?: Dayjs | string | null;
  ends_at?: Dayjs | string | null;
  status?: BenchBookingStatus | string;
}

export interface IBenchBookingRecommendedSlot {
  start: Dayjs;
  end: Dayjs;
}

export interface BenchBookingItem {
  id: number;
  booking_code: string;
  bench: {
    id: number;
    uid?: string;
    sku?: string | null;
    name: string;
  } | null;
  starts_at: string;
  ends_at: string;
  status: string;
  approval_status: string;
  reason: string;
  creator: {
    id: number;
    username: string;
    display_name?: string;
  } | null;
  approval_by: {
    id?: number;
    username: string;
    display_name?: string;
  } | null;
  project: {
    id: number;
    name: string;
  } | null;
  computer: {
    id?: number;
    computer_name?: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export type BenchBookingListRead = BenchBookingItem;
