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
import { useGetSampleOptionsQuery } from "@/features/lab-equipment/sample/api";
import { useGetLicenseOptionsQuery } from "@/features/lab-equipment/license/api";
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
}

export const BenchTable = memo(function BenchTable({
  data,
  totalCount,
  isLoading,
  refetch,
  state,
  handleFavoriteClick,
  openModal,
}: BenchTableProps) {
  const { styles } = useBenchTableStyles();
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const { data: filterOptions } = useGetBenchFilterOptionsQuery();
  const { data: sampleOptionsData } = useGetSampleOptionsQuery();
  const { data: licenseOptionsData } = useGetLicenseOptionsQuery();
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

  const sampleFilters = useMemo(() => {
    const list = Array.isArray(sampleOptionsData)
      ? sampleOptionsData
      : Array.isArray((sampleOptionsData as unknown as { data?: unknown })?.data)
        ? ((sampleOptionsData as unknown as { data: unknown[] }).data as Array<{ label?: string; value?: number }>)
        : [];
    const map = new Map<string, number[]>();
    for (const s of list) {
      if (!s || typeof s !== 'object') continue;
      const label = (s as { label?: string }).label ?? '';
      const val = (s as { value?: number }).value;
      if (typeof val === 'number') {
        const ids = map.get(label) ?? [];
        ids.push(val);
        map.set(label, ids);
      }
    }
    return Array.from(map.entries()).map(([text, ids]) => ({
      value: ids.join("|"),
      text,
    }));
  }, [sampleOptionsData]);

  const licenseFilters = useMemo(() => {
    const list = Array.isArray(licenseOptionsData)
      ? licenseOptionsData
      : Array.isArray((licenseOptionsData as unknown as { data?: unknown })?.data)
        ? ((licenseOptionsData as unknown as { data: unknown[] }).data as Array<{ label?: string; value?: number }>)
        : [];
    const map = new Map<string, number[]>();
    for (const l of list) {
      if (!l || typeof l !== 'object') continue;
      const label = (l as { label?: string }).label ?? '';
      const val = (l as { value?: number }).value;
      if (typeof val === 'number') {
        const ids = map.get(label) ?? [];
        ids.push(val);
        map.set(label, ids);
      }
    }
    return Array.from(map.entries()).map(([text, ids]) => ({
      value: ids.join("|"),
      text,
    }));
  }, [licenseOptionsData]);

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
            placeholder="Search by Bench Group, Bench Name, Computer, etc."
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
                : "Show only favorite benches"
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
            tooltip="Clear all filters"
            icon={<ClearOutlined />}
            onClick={state.clearAllFilters}
          >
            Clear All Filters
          </TooltipButton>
          <TooltipButton
            loading={isManualRefreshing}
            responsive
            tooltip="Re-fetch data"
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
        locale={{ emptyText: "No benches found — try adjusting filters" }}
        onChange={state.handleTableChange}
        pagination={{
          total: totalCount,
          current: state.page,
          pageSize: state.pageSize,
          pageSizeOptions: [5, 10, 25, 50],
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        scroll={{ x: 1000, y: "calc(100vh - 280px)" }}
      />
    </Card>
  );
});

export const LabDeviceTable = BenchTable;
