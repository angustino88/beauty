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
      title="Top Users by Lab Usage"
      subtitle={getChartSubtitle(filters)}
      loading={isFetching}
      error={isError}
      onRetry={refetch}
      component={<UserByLabUsageChart dataSource={data ?? []} />}
      filters={
        <OrderRankDateFilter
          filterParams={filters}
          onChange={setFilters}
          onExport={
            data
              ? () =>
                  void exportRowsToExcel(
                    data,
                    analyticsColumnIndex.userByLabUsage,
                    "Top_Users_by_Lab_Usage",
                    "Top Users by Lab Usage",
                  )
              : undefined
          }
        />
      }
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={() => {
        onClose();
        setFilters((f) => ({ ...f, top: 5 }));
      }}
    />
  );
});
