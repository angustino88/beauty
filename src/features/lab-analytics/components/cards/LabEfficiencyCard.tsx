import { memo, useState } from "react";
import { useGetLabEfficiencyQuery } from "../../api/chartEndpoints";
import { analyticsColumnIndex, DEFAULT_DURATION } from "../../utils/charts";
import { exportRowsToExcel } from "../../utils/export";
import { getChartSubtitle } from "../../utils";
import type { ChartDurationParams } from "../../types";
import { LabEfficiencyChart } from "../charts";
import { OrderRankDateFilter } from "../filters";
import { ChartCard } from "../ChartCard";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const LabEfficiencyCard = memo(function LabEfficiencyCard({
  isOpen,
  onOpen,
  onClose,
}: Props) {
  const [filters, setFilters] = useState<ChartDurationParams>(DEFAULT_DURATION);
  const { data, isFetching, isError, refetch } = useGetLabEfficiencyQuery(filters);
  return (
    <ChartCard
      id={2}
      title="Computer utilization"
      description="Logged-in hours per computer as a share of official working hours in the period."
      subtitle={getChartSubtitle(filters)}
      loading={isFetching}
      error={isError}
      onRetry={refetch}
      component={<LabEfficiencyChart dataSource={data ?? []} />}
      onExport={
        data
          ? () =>
              void exportRowsToExcel(
                data,
                analyticsColumnIndex.labEfficiency,
                "Computer_utilization",
                "Computer utilization",
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
