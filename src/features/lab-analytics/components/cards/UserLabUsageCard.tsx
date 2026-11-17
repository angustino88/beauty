import { memo, useState } from "react";
import { useGetUserLabUsageQuery } from "../../api/chartEndpoints";
import { analyticsColumnIndex, DEFAULT_DURATION } from "../../utils/charts";
import { exportRowsToExcel } from "../../utils/export";
import { getChartSubtitle } from "../../utils";
import type { ChartDurationParams } from "../../types";
import { UserByLabUsageChart } from "../charts";
import { OrderRankDateFilter } from "../filters";
import { ChartCard } from "../ChartCard";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const UserLabUsageCard = memo(function UserLabUsageCard({
  isOpen,
  onOpen,
  onClose,
}: Props) {
  const [filters, setFilters] = useState<ChartDurationParams>(DEFAULT_DURATION);
  const { data, isFetching, isError, refetch } = useGetUserLabUsageQuery(filters);
  return (
    <ChartCard
      id={4}
      title="Usage hours by user"
      description="Hours of remote sessions per user in the period."
      subtitle={getChartSubtitle(filters)}
      loading={isFetching}
      error={isError}
      onRetry={refetch}
      component={<UserByLabUsageChart dataSource={data ?? []} />}
      onExport={
        data
          ? () =>
              void exportRowsToExcel(
                data,
                analyticsColumnIndex.userByLabUsage,
                "Usage_hours_by_user",
                "Usage hours by user",
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
