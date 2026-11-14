import dayjs from "dayjs";
import { memo } from "react";
import { useLabsAnalyticsLabEquipmentStatusRetrieveQuery } from "@/shared/api/generated/api";
import { mapEquipmentStatusSummary } from '../../mapper';
import { analyticsColumnIndex } from "../../utils/charts";
import { exportRowsToExcel } from "../../utils/export";
import { LabEquipmentStatusChart } from "../charts";
import { ChartCard } from "../ChartCard";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const LabEquipmentStatusCard = memo(function LabEquipmentStatusCard({
  isOpen,
  onOpen,
  onClose,
}: Props) {
  const { data: response, isFetching, isError, refetch } = useLabsAnalyticsLabEquipmentStatusRetrieveQuery();
  const data = response ? mapEquipmentStatusSummary(response) : undefined;
  return (
    <ChartCard
      id={1}
      title="Lab Equipment Status"
      subtitle={`Today, ${dayjs().format("DD MMM YYYY")}`}
      loading={isFetching}
      error={isError}
      onRetry={refetch}
      component={<LabEquipmentStatusChart statusSummary={data} />}
      onExport={
        data
          ? () =>
              void exportRowsToExcel(
                data,
                analyticsColumnIndex.labEquipmentStatus,
                "Lab_Equipment_Status",
                "Lab Equipment Status",
              )
          : undefined
      }
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
    />
  );
});
