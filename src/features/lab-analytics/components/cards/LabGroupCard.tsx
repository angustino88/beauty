import dayjs from "dayjs";
import { memo } from "react";
import { useLabsAnalyticsBenchGroupRetrieveQuery } from "@/shared/api/generated/api";
import { mapLabGroupSummary } from '../../mapper';
import { analyticsColumnIndex } from "../../utils/charts";
import { exportRowsToExcel } from "../../utils/export";
import { LabGroupChart } from "../charts";
import { ChartCard } from "../ChartCard";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const LabGroupCard = memo(function LabGroupCard({
  isOpen,
  onOpen,
  onClose,
}: Props) {
  const { data: response, isFetching, isError, refetch } = useLabsAnalyticsBenchGroupRetrieveQuery();
  const data = response ? mapLabGroupSummary(response) : undefined;
  return (
    <ChartCard
      id={0}
      title="Benches per group"
      description="How many benches each bench group holds right now."
      subtitle={`Right now · ${dayjs().format("D MMM YYYY")}`}
      loading={isFetching}
      error={isError}
      onRetry={refetch}
      component={<LabGroupChart dataSource={data ?? []} />}
      onExport={
        data
          ? () =>
              void exportRowsToExcel(
                data,
                analyticsColumnIndex.labGroup,
                "Benches_per_group",
                "Benches per group",
              )
          : undefined
      }
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    />
  );
});
