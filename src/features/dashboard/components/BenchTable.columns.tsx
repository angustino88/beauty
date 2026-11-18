// src/features/dashboard/components/BenchTable.columns.tsx
import {
  CalendarOutlined,
  LaptopOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { NavigateFunction } from 'react-router-dom';
import type { MouseEvent } from 'react';
import dayjs from 'dayjs';
import { AvatarRenderer } from '@/components/display/AvatarRenderer';
import { LabStatus } from '@/components/display/LabStatus';
import { MultipleTagCell } from '@/components/display/MultipleTagCell';
import { TooltipButton } from '@/components/layout/TooltipButton';
import { isCurrentlyBooked } from '../types';
import { BENCH_ACTIVITY_META } from '@/shared/status/statusTone';
import type { DashboardState } from '../hooks/useDashboardState';
import { SUMMARY_STATUS_VALUES } from '../types';
import type { DashboardBench, BenchFilterOptions } from '../types';

const STATUS_FILTER_OPTIONS = SUMMARY_STATUS_VALUES.map((s) => ({
  value: s,
  text: BENCH_ACTIVITY_META[s]?.label ?? s,
}));

/** One look for "nothing here" in every cell. */
const EMPTY = <span style={{ color: 'var(--lm-text-disabled)' }} aria-label="None">–</span>;
const benchLabel = (bench: DashboardBench) => bench.name || bench.lab_name || bench.sku || `bench #${bench.id}`;

export interface BuildColumnsParams {
  state: DashboardState;
  filterOptions?: BenchFilterOptions;
  sampleFilters: Array<{ value: string; text: string }>;
  licenseFilters: Array<{ value: string; text: string }>;
  filterHandlers: Record<string, (visible: boolean) => void>;
  handleFavoriteClick: (benchId: number, isFavorite: boolean, e: MouseEvent) => void;
  openModal: (id: number) => void;
  navigate: NavigateFunction;
  styles: { favoriteActiveBtn: string };
}

export function buildColumns({
  state,
  filterOptions,
  sampleFilters,
  licenseFilters,
  filterHandlers,
  handleFavoriteClick,
  navigate,
  styles,
}: BuildColumnsParams): ColumnsType<DashboardBench> {
  const { columnFilters, summaryStatus } = state;

  const rawGroups = filterOptions?.bench_groups ?? filterOptions?.lab_groups;
  const groupsList = Array.isArray(rawGroups) ? rawGroups : [];
  const benchGroupFilters = groupsList.map((g) => ({
    value: g.id,
    text: g.name ?? (g as { lab_group_name?: string }).lab_group_name ?? `Group ${g.id}`,
  }));

  return [
    {
      title: 'Bench Group',
      dataIndex: 'bench_group',
      key: 'bench_group',
      align: 'left' as const,
      minWidth: 140,
      render: (g: DashboardBench['bench_group']) => g?.name || EMPTY,
      filters: benchGroupFilters,
      filterSearch: true,
      filterMultiple: true,
      filteredValue: columnFilters.lab_group_ids.length ? columnFilters.lab_group_ids : null,
      filterOnClose: false,
      filterDropdownProps: { onOpenChange: filterHandlers['bench_group'] },
    },
    {
      title: 'Status',
      key: 'status',
      align: 'left' as const,
      minWidth: 178,
      filters: STATUS_FILTER_OPTIONS,
      filterSearch: true,
      filterMultiple: true,
      filteredValue: !summaryStatus && columnFilters.status.length ? columnFilters.status : null,
      filterOnClose: false,
      filterDropdownProps: { onOpenChange: filterHandlers['status'] },
      render: (_: unknown, record: DashboardBench) => {
        const rawStatus = record.computing?.activity_status || 'unknown';
        const status = typeof rawStatus === 'string'
          ? rawStatus
          : typeof rawStatus === 'object' && rawStatus !== null && 'value' in rawStatus
            ? String((rawStatus as { value?: unknown }).value ?? 'unknown')
            : 'unknown';
        const isBooked = isCurrentlyBooked(record.current_booking ?? record.booking_status);
        const booking = record.current_booking;
        const bookingDetail = isBooked && booking
          ? [
              booking.ends_at ? `until ${dayjs(booking.ends_at).format('HH:mm')}` : '',
              booking.user?.display_name || booking.user?.username || '',
            ].filter(Boolean).join(' · ')
          : undefined;
        return <LabStatus labStatus={status} isBooked={isBooked} bookingDetail={bookingDetail} />;
      },
    },
    {
      title: 'Bench Name',
      dataIndex: 'name',
      key: 'name',
      align: 'left' as const,
      minWidth: 120,
      render: (_: unknown, record: DashboardBench) => record.name || record.lab_name || EMPTY,
    },
    {
      title: 'Computer Name',
      key: 'comp_name',
      align: 'left' as const,
      minWidth: 150,
      render: (_: unknown, record: DashboardBench) =>
        record.computing?.name || record.computer?.computer_name || EMPTY,
    },
    {
      title: 'Computer IP',
      key: 'comp_ip',
      align: 'left' as const,
      minWidth: 130,
      render: (_: unknown, record: DashboardBench) =>
        record.computing?.ip_address || record.computer?.computer_ip || EMPTY,
    },
    {
      title: 'Remote User',
      key: 'remote_user',
      align: 'center' as const,
      width: 150,
      render: (_: unknown, record: DashboardBench) => {
        const username = record.computing?.remote_user ?? record.remote_user?.username;
        const displayName =
          record.computing?.remote_user_display_name ??
          record.remote_user?.displayname ??
          username;
        return username ? (
          <AvatarRenderer username={username} displayname={displayName} />
        ) : EMPTY;
      },
    },
    {
      title: 'Sample',
      key: 'samples',
      align: 'center' as const,
      minWidth: 120,
      render: (_: unknown, record: DashboardBench) => {
        const samples = record.samples ?? record.samples_list ?? [];
        return Array.isArray(samples) && samples.length ? (
          <div className="sampleTags">
            <MultipleTagCell
              val={samples as unknown as Record<string, unknown>[]}
              displayKey="name"
            />
          </div>
        ) : EMPTY;
      },
      filters: sampleFilters,
      filterSearch: true,
      filterMultiple: true,
      filteredValue: columnFilters.sample_filter_values.length ? columnFilters.sample_filter_values : null,
      filterOnClose: false,
      filterDropdownProps: { onOpenChange: filterHandlers['samples'] },
    },
    {
      title: 'License',
      key: 'licenses',
      align: 'center' as const,
      minWidth: 178,
      render: (_: unknown, record: DashboardBench) => {
        const licenses = record.licenses ?? record.license_list ?? [];
        return Array.isArray(licenses) && licenses.length ? (
          <div className="licenseTags">
            <MultipleTagCell
              val={licenses as unknown as Record<string, unknown>[]}
              displayKey="name"
            />
          </div>
        ) : EMPTY;
      },
      filters: licenseFilters,
      filterSearch: true,
      filterMultiple: true,
      filteredValue: columnFilters.license_filter_values.length ? columnFilters.license_filter_values : null,
      filterOnClose: false,
      filterDropdownProps: { onOpenChange: filterHandlers['licenses'] },
    },
    {
      title: 'RDP',
      key: 'rdpFile',
      align: 'center' as const,
      minWidth: 90,
      render: (_: unknown, record: DashboardBench) => {
        const rdpFilePath = record.computing?.rdp_file_url ?? record.computer?.rdp_file;
        const href = rdpFilePath
          ? /^https?:\/\//i.test(rdpFilePath)
            ? rdpFilePath
            : `${import.meta.env.VITE_APP_URL || ''}${rdpFilePath.startsWith('/') ? rdpFilePath.slice(1) : rdpFilePath}`
          : undefined;

        const computerName = record.computing?.name || record.computer?.computer_name;
        return (
          <TooltipButton
            tooltip={`Download the remote desktop (.rdp) file for ${computerName || benchLabel(record)}`}
            disabledReason={computerName ? `No remote desktop file for ${computerName}` : 'No computer is mapped to this bench'}
            icon={<LaptopOutlined />}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            disabled={!rdpFilePath}
          />
        );
      },
    },
    {
      title: 'Actions',
      key: 'action',
      fixed: 'right' as const,
      align: 'center' as const,
      minWidth: 130,
      render: (_: unknown, bench: DashboardBench) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <TooltipButton
            placement="top"
            tooltip={bench.is_favorite ? `Remove ${benchLabel(bench)} from favorites` : `Add ${benchLabel(bench)} to favorites`}
            type="text"
            size="small"
            icon={
              bench.is_favorite ? (
                <StarFilled style={{ color: 'var(--lm-warning-solid)', fontSize: 16 }} />
              ) : (
                <StarOutlined style={{ fontSize: 16 }} />
              )
            }
            className={bench.is_favorite ? styles.favoriteActiveBtn : undefined}
            onClick={(e) => handleFavoriteClick(bench.id, !!bench.is_favorite, e)}
            style={{ padding: 0, border: 'none', alignSelf: 'center' }}
          />
          <TooltipButton
            placement="top"
            tooltip={`Book ${benchLabel(bench)}`}
            disabledReason="Can't book: no computer is mapped to this bench"
            disabled={!bench.computing && !bench.computer}
            icon={<CalendarOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/booking-calendar?action=create&bench_ids=${bench.id}`);
            }}
          />
        </div>
      ),
    },
  ];
}
