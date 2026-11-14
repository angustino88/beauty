import { memo, useState } from "react";
import { useGetStorageQuotaQuery } from "../../api/chartEndpoints";
import { analyticsColumnIndex, DEFAULT_DATE } from "../../utils/charts";
import { exportRowsToExcel } from "../../utils/export";
import { getChartSubtitle } from "../../utils";
import type { ChartDateParams } from "../../types";
import { UserStorageQuotaChart } from "../charts";
import { DateFilter } from "../filters";
import { ChartCard } from "../ChartCard";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const UserStorageQuotaCard = memo(function UserStorageQuotaCard({
  isOpen,
  onOpen,
  onClose,
}: Props) {
  const [filters, setFilters] = useState<ChartDateParams>(DEFAULT_DATE);
  const { data, isFetching, isError, refetch } = useGetStorageQuotaQuery(filters);
  return (
    <ChartCard
      id={7}
      title="User Storage Utilization"
      subtitle={getChartSubtitle(filters, false)}
      loading={isFetching}
      error={isError}
      onRetry={refetch}
      component={<UserStorageQuotaChart dataSource={data ?? []} />}
      filters={
        <DateFilter
          filterParams={filters}
          onChange={setFilters}
          onExport={
            data
              ? () =>
                  void exportRowsToExcel(
                    data,
                    analyticsColumnIndex.userStorageQuota,
                    "User_Storage_Utilization",
                    "User Storage Utilization",
                  )
              : undefined
          }
        />
      }
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={() => {
        onClose();
        setFilters((f) => ({ ...f, top: 12 }));
      }}
    />
  );
});
