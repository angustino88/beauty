import { memo, useState } from "react";
import { useGetProjectUsageQuery } from "../../api/chartEndpoints";
import { analyticsColumnIndex, DEFAULT_DURATION } from "../../utils/charts";
import { exportRowsToExcel } from "../../utils/export";
import { getChartSubtitle } from "../../utils";
import type { ChartDurationParams } from "../../types";
import { ProjectUsageChart } from "../charts";
import { OrderRankDateFilter } from "../filters";
import { ChartCard } from "../ChartCard";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const ProjectUsageCard = memo(function ProjectUsageCard({
  isOpen,
  onOpen,
  onClose,
}: Props) {
  const [filters, setFilters] = useState<ChartDurationParams>(DEFAULT_DURATION);
  const { data, isFetching, isError, refetch } = useGetProjectUsageQuery(filters);
  return (
    <ChartCard
      id={3}
      title="Usage hours by project"
      description="Hours of remote sessions per project in the period."
      subtitle={getChartSubtitle(filters)}
      loading={isFetching}
      error={isError}
      onRetry={refetch}
      component={<ProjectUsageChart dataSource={data ?? []} />}
      onExport={
        data
          ? () =>
              void exportRowsToExcel(
                data,
                analyticsColumnIndex.projectUsage,
                "Usage_hours_by_project",
                "Usage hours by project",
              )
          : undefined
      }
      filters={
        <OrderRankDateFilter
          filterParams={filters}
          onChange={setFilters}
        />
      }
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    />
  );
});
