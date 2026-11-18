import { useMemo } from "react";
import { Alert } from "antd";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardSummary } from "../components/DashboardSummary";
import { BenchTable } from "../components/BenchTable";
import { BenchDetailModal } from "../components/modals/BenchDetailModal";
import NotFound from "@/pages/errors/NotFound";
import ServerError from "@/pages/errors/ServerError";
import { useGetDashboardPageQuery, useGetDashboardSummaryQuery } from "../api";
import { useDashboardState } from "../hooks/useDashboardState";
import { useDashboardFavorites } from "../hooks/useDashboardFavorites";
import { useBenchDetailModal } from "../hooks/useBenchDetailModal";
import type { DerivedDashboardStats, DashboardBench } from "../types";

const EMPTY_STATS: DerivedDashboardStats = {
  totalCount: 0,
  freeCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  maintainingCount: 0,
  offlineCount: 0,
};

const EMPTY_DATA: DashboardBench[] = [];

const getStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== "object" || !("status" in error)) return null;
  const status = (error as { status: unknown }).status;
  return typeof status === "number" ? status : null;
};

export default function Dashboard() {
  const { data: summaryData, error: summaryError } =
    useGetDashboardSummaryQuery();

  const derivedStats = useMemo<DerivedDashboardStats>(() => {
    if (!summaryData) return EMPTY_STATS;
    const total = summaryData.total_benches ?? summaryData.total ?? 0;
    const dist = summaryData.activity_distribution ?? summaryData.status ?? {};
    return {
      totalCount: total,
      freeCount: dist["free"] ?? 0,
      activeCount: dist["active"] ?? 0,
      inactiveCount: dist["inactive"] ?? 0,
      maintainingCount: (dist["maintaining"] ?? 0) + (dist["maintenance"] ?? 0),
      offlineCount: dist["offline"] ?? 0,
    };
  }, [summaryData]);

  const state = useDashboardState();

  // isLoading = first-time fetch (no cached data) → show skeleton
  // isFetching = any fetch including background refetches → DON'T show spinner (silent)
  const {
    data: pageData,
    isLoading,
    isError,
    error: pageError,
    refetch,
  } = useGetDashboardPageQuery(state.queryParams);

  // Sample and license filters have no server-side parameter: their options come from, and they
  // narrow, the loaded page. Items sharing a label are grouped so one choice covers all of them.
  const pageFilterOptions = useMemo(() => {
    const collect = (pick: (row: DashboardBench) => Array<{ id: number; sku?: string; name?: string }> | undefined) => {
      const byLabel = new Map<string, number[]>();
      for (const row of pageData?.results ?? []) {
        for (const item of pick(row) ?? []) {
          const label = item.sku ? `${item.name ?? item.sku} (${item.sku})` : (item.name ?? String(item.id));
          const ids = byLabel.get(label) ?? [];
          if (!ids.includes(item.id)) ids.push(item.id);
          byLabel.set(label, ids);
        }
      }
      return Array.from(byLabel.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([text, ids]) => ({ text, value: ids.join('|') }));
    };
    return { samples: collect((row) => row.samples), licenses: collect((row) => row.licenses) };
  }, [pageData?.results]);

  // Sample and license filters have no server-side parameter; they narrow the loaded page.
  const { sample_ids: sampleIds, license_ids: licenseIds } = state.columnFilters;
  const tableData = useMemo(() => {
    const rows = pageData?.results ?? EMPTY_DATA;
    if (!sampleIds.length && !licenseIds.length) return rows;
    return rows.filter(
      (row) =>
        (!sampleIds.length || (row.samples ?? []).some((sample) => sampleIds.includes(sample.id))) &&
        (!licenseIds.length || (row.licenses ?? []).some((license) => licenseIds.includes(license.id))),
    );
  }, [pageData?.results, sampleIds, licenseIds]);
  const totalCount = pageData?.total_count ?? 0;

  const { handleFavoriteClick } = useDashboardFavorites();
  const { modalBenchId, openModal, closeModal, benchDetail, isDetailFetching } =
    useBenchDetailModal();
  const statusCode = getStatusCode(pageError) ?? getStatusCode(summaryError);

  // Render error in-place without changing URL
  if (statusCode === 404) {
    return <NotFound />;
  }
  if (statusCode !== null && statusCode >= 500) {
    return <ServerError />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="Dashboard"
        description="Live status of every bench. Click a row for details, or use the status chips to filter."
      />

      {isError &&
        statusCode !== 404 &&
        statusCode !== null &&
        statusCode < 500 && (
          <Alert
            type="error"
            message="Failed to load dashboard data"
            description="Please check your connection and try refreshing."
            showIcon
            action={<a onClick={() => void refetch()}>Retry</a>}
          />
        )}

      <DashboardSummary
        stats={derivedStats}
        activeSummary={state.summaryStatus}
        onSummaryClick={state.handleSummaryClick}
      />

      <BenchTable
        data={tableData}
        totalCount={totalCount}
        isLoading={isLoading}
        refetch={refetch}
        state={state}
        handleFavoriteClick={handleFavoriteClick}
        openModal={openModal}
        sampleFilters={pageFilterOptions.samples}
        licenseFilters={pageFilterOptions.licenses}
      />

      <BenchDetailModal
        modalBenchId={modalBenchId}
        closeModal={closeModal}
        benchDetail={benchDetail}
        isDetailFetching={isDetailFetching}
      />
    </div>
  );
}
