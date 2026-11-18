import { memo, useState } from "react";
import { useGetLabUsageByTimeframeQuery } from "../../api/chartEndpoints";
import { analyticsColumnIndex, DEFAULT_DURATION } from "../../utils/charts";
import { exportRowsToExcel } from "../../utils/export";
import { getChartSubtitle } from "../../utils";
import type { ChartDurationParams } from "../../types";
import { LabUsageByTimeFrameChart } from "../charts";
import { DatePeriodFilter } from "../filters";
import { ChartCard } from "../ChartCard";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const LabUsageTimeFrameCard = memo(function LabUsageTimeFrameCard({
  isOpen,
  onOpen,
  onClose,
}: Props) {
  const [filters, setFilters] = useState<ChartDurationParams>(DEFAULT_DURATION);
  const { data, isFetching, isError, refetch } = useGetLabUsageByTimeframeQuery(filters);
  return (
    <ChartCard
      id={6}
      title="Usage by time of day"
      description="Session hours in each time slot of the day across the period."
      subtitle={getChartSubtitle(filters, false)}
      loading={isFetching}
      error={isError}
      onRetry={refetch}
      component={<LabUsageByTimeFrameChart dataSource={data ?? []} />}
      onExport={
        data
          ? () =>
              void exportRowsToExcel(
                data,
                analyticsColumnIndex.labUsageByTimeframe,
                "Usage_by_time_of_day",
                "Usage by time of day",
              )
          : undefined
      }
      filters={
        <DatePeriodFilter
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
