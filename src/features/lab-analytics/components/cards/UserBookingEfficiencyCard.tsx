import { memo, useState } from "react";
import { useGetUserBookingEfficiencyQuery } from "../../api/chartEndpoints";
import { analyticsColumnIndex, DEFAULT_DURATION } from "../../utils/charts";
import { exportRowsToExcel } from "../../utils/export";
import { getChartSubtitle } from "../../utils";
import type { ChartDurationParams } from "../../types";
import { UserByBookingEfficiencyChart } from "../charts";
import { OrderRankDateFilter } from "../filters";
import { ChartCard } from "../ChartCard";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const UserBookingEfficiencyCard = memo(
  function UserBookingEfficiencyCard({ isOpen, onOpen, onClose }: Props) {
    const [filters, setFilters] =
      useState<ChartDurationParams>(DEFAULT_DURATION);
    const { data, isFetching, isError, refetch } = useGetUserBookingEfficiencyQuery(filters);
    return (
      <ChartCard
        id={5}
        title="Top Users by Booking Efficiency"
        subtitle={getChartSubtitle(filters)}
        loading={isFetching}
        error={isError}
        onRetry={refetch}
        component={<UserByBookingEfficiencyChart dataSource={data ?? []} />}
        filters={
          <OrderRankDateFilter
            filterParams={filters}
            onChange={setFilters}
            onExport={
              data
                ? () =>
                    void exportRowsToExcel(
                      data,
                      analyticsColumnIndex.userByBookingEfficiency,
                      "Top_Users_by_Booking_Efficiency",
                      "Top Users by Booking Efficiency",
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
  },
);
