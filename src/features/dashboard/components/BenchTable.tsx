// src/features/dashboard/components/BenchTable.tsx
import React, { memo, useCallback, useMemo, useState } from "react";
import { Card, Grid, Table } from "antd";
import {
  ClearOutlined,
  UndoOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { FullTextSearch } from "@/components/inputs/FullTextSearch";
import { TooltipButton } from "@/components/layout/TooltipButton";
import { useBenchTableStyles } from "./BenchTable.styles";
import { buildColumns } from "./BenchTable.columns";
import { useDashboardRealtime } from "../hooks/useDashboardRealtime";
import { useFilterDropdownGuard } from "../hooks/useFilterDropdownGuard";
import { useGetBenchFilterOptionsQuery } from "../api";
import type { DashboardState } from "../hooks/useDashboardState";
import type { DashboardBench } from "../types";
import type { MouseEvent } from "react";

export interface BenchTableProps {
  data: DashboardBench[];
  totalCount: number;
  isLoading: boolean;
  refetch: () => void;
  state: DashboardState;
  handleFavoriteClick: (
    benchId: number,
    isFavorite: boolean,
    e: MouseEvent,
  ) => void;
  openModal: (id: number) => void;
  /** Dropdown options for the sample and license filters, taken from the loaded page. */
  sampleFilters: Array<{ text: string; value: string }>;
  licenseFilters: Array<{ text: string; value: string }>;
}

export const BenchTable = memo(function BenchTable({
  data,
  totalCount,
  isLoading,
  refetch,
  state,
  handleFavoriteClick,
  openModal,
  sampleFilters,
  licenseFilters,
}: BenchTableProps) {
  const { styles } = useBenchTableStyles();
  const { lg, sm } = Grid.useBreakpoint();
  const navigate = useNavigate();

  const { data: filterOptions } = useGetBenchFilterOptionsQuery();
  const { columnFilters } = state;
  const hasFilters = Boolean(
    state.search.trim() || state.summaryStatus || state.showFavoritesOnly
      || columnFilters.status.length || columnFilters.lab_group_ids.length
      || columnFilters.sample_filter_values.length || columnFilters.license_filter_values.length,
  );
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const { makeFilterDropdownHandler, isAnyFilterOpen } =
    useFilterDropdownGuard();

  useDashboardRealtime({ isAnyFilterOpen });

  const filterHandlers = useMemo(
    () => ({
      bench_group: makeFilterDropdownHandler("bench_group"),
      status: makeFilterDropdownHandler("status"),
      samples: makeFilterDropdownHandler("samples"),
      licenses: makeFilterDropdownHandler("licenses"),
    }),
    [makeFilterDropdownHandler],
  );

  const onRow = useCallback(
    (record: { id: number }) => ({
      onClick: (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, a")) return;
        openModal(record.id);
      },
    }),
    [openModal],
  );

  const handleManualRefetch = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch]);

  const columns = useMemo(
    () =>
      buildColumns({
        state,
        filterOptions,
        sampleFilters,
        licenseFilters,
        filterHandlers,
        handleFavoriteClick,
        openModal,
        pinActions: Boolean(lg),
        navigate,
        styles,
      }),
    [
      state,
      filterOptions,
      sampleFilters,
      licenseFilters,
      filterHandlers,
      handleFavoriteClick,
      openModal,
      lg,
      navigate,
      styles,
    ],
  );

  return (
    <Card className={styles.customTableStyles}>
      <div className="toolbar">
        <FullTextSearch
          className="benchSearch"
          value={state.search}
          onSearch={state.setSearch}
          placeholder="Search benches, groups, computers or users"
        />
        <div className="toolbarActions" role="group" aria-label="Bench table actions">
          <TooltipButton
            responsive
            aria-pressed={state.showFavoritesOnly}
            tooltip={
              state.showFavoritesOnly
                ? "Show all benches"
                : "Show only your favorite benches"
            }
            icon={
              state.showFavoritesOnly ? (
                <StarFilled style={{ color: "var(--lm-warning-solid)" }} />
              ) : (
                <StarOutlined />
              )
            }
            onClick={() => state.setShowFavoritesOnly(!state.showFavoritesOnly)}
          >
            Favorites
          </TooltipButton>
          <TooltipButton
            responsive
            tooltip="Clear search and filters"
            disabledReason="No search or filter is applied"
            disabled={!hasFilters}
            icon={<ClearOutlined />}
            onClick={state.clearAllFilters}
          >
            Clear filters
          </TooltipButton>
          <TooltipButton
            loading={isManualRefreshing}
            responsive
            tooltip="Reload now (the table also updates live)"
            icon={<UndoOutlined />}
            onClick={() => void handleManualRefetch()}
          >
            Refresh
          </TooltipButton>
        </div>
      </div>

      <Table
        loading={isLoading || isManualRefreshing}
        onRow={onRow}
        tableLayout="auto"
        className={styles.customTableStyles}
        columns={columns}
        rowKey="id"
        sticky={{ offsetHeader: 0 }}
        dataSource={Array.isArray(data) ? data : []}
        locale={{ emptyText: hasFilters ? "No benches match the search or filters. Clear them to see all benches." : "No benches yet." }}
        onChange={state.handleTableChange}
        pagination={{
          total: totalCount,
          current: state.page,
          pageSize: state.pageSize,
          pageSizeOptions: [5, 10, 25, 50],
          showQuickJumper: Boolean(sm),
          showSizeChanger: true,
          showTotal: (total, [from, to]) => `${from}–${to} of ${total} ${total === 1 ? "bench" : "benches"}`,
        }}
        scroll={{ x: 1000, y: "calc(100vh - 280px)" }}
      />
    </Card>
  );
});
