// src/features/dashboard/components/BenchTable.tsx
import React, { memo, useCallback, useMemo, useState } from "react";
import { Card, Col, Row, Table, theme } from "antd";
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
  const { token } = theme.useToken();
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
        if (
          target.tagName === "BUTTON" ||
          target.closest("button") ||
          target.tagName === "A" ||
          target.closest("a")
        )
          return;
        openModal(record.id);
      },
      style: { cursor: "pointer" } as React.CSSProperties,
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
      navigate,
      styles,
    ],
  );

  return (
    <Card
      className={styles.customTableStyles}
      style={
        {
          ["--focus-ring-color" as string]: token.colorPrimaryBorder,
        } as React.CSSProperties
      }
    >
      <Row className="toolbar" gutter={[12, 12]} align="middle">
        <Col flex="1 1 360px" style={{ minWidth: 0 }}>
          <FullTextSearch
            value={state.search}
            onSearch={state.setSearch}
            placeholder="Search benches, groups, computers or users"
          />
        </Col>
        <Col
          flex="none"
          style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
        >
          <TooltipButton
            responsive
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
        </Col>
      </Row>

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
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total, [from, to]) => `${from}–${to} of ${total} ${total === 1 ? "bench" : "benches"}`,
        }}
        scroll={{ x: 1000, y: "calc(100vh - 280px)" }}
      />
    </Card>
  );
});

export const LabDeviceTable = BenchTable;
