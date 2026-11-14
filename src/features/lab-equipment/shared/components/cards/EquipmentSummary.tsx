/* eslint-disable react-refresh/only-export-components */
import { Col, Row } from "antd";
import { baseApi } from "@/shared/lib/api";
import SummaryCard from "./SummaryCard";

interface ISummaryData {
  total?: number;
  active?: number;
  inactive?: number;
  maintenance?: number;
  available?: number;
  in_use?: number;
  borrowed?: number;
  expired?: number;
  trial?: number;
  others?: number;
  [key: string]: number | undefined;
}

type SummaryStatusCount = { status: string; count: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeStatusKey = (status: string) =>
  status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

function toSummaryObject(payload: unknown): ISummaryData {
  const applyStatusEntry = (
    target: ISummaryData,
    status: string,
    count: unknown,
  ) => {
    const key = normalizeStatusKey(status);
    const value = Number(count ?? 0);
    if (!Number.isFinite(value)) return;
    target[key] = value;
  };

  if (Array.isArray(payload)) {
    const entries = payload as SummaryStatusCount[];
    const mapped = entries.reduce<ISummaryData>((acc, item) => {
      if (item && typeof item.status === "string") {
        applyStatusEntry(acc, item.status, item.count);
      }
      return acc;
    }, {});
    if (mapped.total === undefined) {
      mapped.total = entries.reduce(
        (sum, item) => sum + Number(item?.count ?? 0),
        0,
      );
    }
    return mapped;
  }

  if (isRecord(payload)) {
    const dataObj = isRecord(payload.data) ? payload.data : payload;
    const mapped = Object.entries(dataObj).reduce<ISummaryData>(
      (acc, [key, value]) => {
        if (
          (key === "total_count" ||
            key === "total" ||
            key === "total_benches") &&
          typeof value === "number"
        ) {
          acc.total = value;
          return acc;
        }

        if (
          key === "statuses" ||
          key === "status" ||
          key === "status_distribution" ||
          key === "activity_distribution" ||
          key === "lifecycle_distribution"
        ) {
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item && typeof item === "object") {
                const rec = item as Record<string, unknown>;
                const rawStatus = rec.status;
                const statusStr =
                  typeof rawStatus === "object" && rawStatus !== null
                    ? String((rawStatus as { value?: unknown }).value ?? "")
                    : String(rawStatus ?? "");
                const count = rec.resource_count ?? rec.count;
                if (statusStr) {
                  applyStatusEntry(acc, statusStr, count);
                }
              }
            }
          } else if (isRecord(value)) {
            for (const [status, count] of Object.entries(value)) {
              applyStatusEntry(acc, status, count);
            }
          }
          return acc;
        }

        if (typeof value === "number") {
          acc[key] = value;
        }
        return acc;
      },
      {},
    );

    if (mapped.total === undefined) {
      const known = Object.entries(mapped)
        .filter(([key]) => key !== "total")
        .reduce((sum, [, value]) => sum + Number(value ?? 0), 0);
      mapped.total = known;
    }

    return mapped;
  }

  return {};
}

export const equipmentSummaryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEquipmentSummaryByType: build.query<unknown, string>({
      query: (equipmentType) => {
        const typeMap: Record<string, string> = {
          license: "licenses/status-summary",
          licenses: "licenses/status-summary",
          room: "rooms/status-summary",
          rooms: "rooms/status-summary",
        };
        const subpath = typeMap[equipmentType.toLowerCase()] ?? 'equipment/status-summary';
        return `/api/labs/${subpath}`;
      },
    }),
  }),
  overrideExisting: false,
});

export const { useGetEquipmentSummaryByTypeQuery } = equipmentSummaryApi;

export function useGetEquipmentSummaryQuery(
  equipmentType: string,
  options?: Parameters<typeof useGetEquipmentSummaryByTypeQuery>[1],
) {
  return useGetEquipmentSummaryByTypeQuery(equipmentType, options);
}

const EQUIPMENT_STATUS_CARDS = [
  { label: "Total", key: "total", bg: "#172554", color: "#ffffff" },
  { label: "In Use", key: "in_use", bg: "#1d4ed8", color: "#ffffff" },
  { label: "Available", key: "available", bg: "#047857", color: "#ffffff" },
  { label: "Borrowed", key: "borrowed", bg: "#b45309", color: "#ffffff" },
  { label: "Other Statuses", key: "others", bg: "#475569", color: "#ffffff" },
];

const LICENSE_CARDS = [
  { label: "Total", key: "total", bg: "#172554", color: "#ffffff" },
  { label: "Active", key: "active", bg: "#047857", color: "#ffffff" },
  { label: "Inactive", key: "inactive", bg: "#475569", color: "#ffffff" },
  { label: "Expired", key: "expired", bg: "#be123c", color: "#ffffff" },
  { label: "Trial", key: "trial", bg: "#1d4ed8", color: "#ffffff" },
  { label: "Other Statuses", key: "others", bg: "#475569", color: "#ffffff" },
];

export interface EquipmentSummaryProps {
  equipmentType: string;
  isLicense?: boolean;
  overrideData?: Record<string, number | undefined>;
  overrideTotal?: number;
  skipFetch?: boolean;
  loadingOverride?: boolean;
}

const EquipmentSummary: React.FC<EquipmentSummaryProps> = ({
  equipmentType,
  isLicense,
  overrideData,
  overrideTotal,
  skipFetch = false,
  loadingOverride,
}) => {
  const resolvedType =
    equipmentType === "power_supply" ? "powersupply" : equipmentType;
  const skipSummaryApi = skipFetch || equipmentType === "room";

  const { data, isLoading } = useGetEquipmentSummaryQuery(resolvedType, {
    skip: skipSummaryApi,
  });
  const fetchedSummary = toSummaryObject(data);

  const summaryData: ISummaryData = overrideData
    ? {
        ...fetchedSummary,
        ...overrideData,
        total: overrideTotal ?? overrideData.total ?? fetchedSummary.total,
      }
    : { ...fetchedSummary };

  if (overrideTotal !== undefined) {
    summaryData.total = overrideTotal;
  }

  const config = isLicense ? LICENSE_CARDS : EQUIPMENT_STATUS_CARDS;

  if (summaryData.total !== undefined && summaryData.others === undefined) {
    const knownKeys = isLicense
      ? ["active", "inactive", "expired", "trial"]
      : ["in_use", "available", "borrowed"];
    const knownTotal = knownKeys.reduce(
      (sum, key) => sum + (summaryData[key] ?? 0),
      0,
    );
    summaryData.others = Math.max(0, (summaryData.total ?? 0) - knownTotal);
  }

  return (
    <Row
      gutter={8}
      style={{ padding: "16px 0", marginLeft: 0, marginRight: 0 }}
    >
      {config.map((item) => (
        <Col span={4} key={`${equipmentType}-${item.key}`}>
          <SummaryCard
            label={item.label}
            value={summaryData[item.key] ?? 0}
            backgroundColor={item.bg}
            color={item.color}
            loading={loadingOverride ?? isLoading}
          />
        </Col>
      ))}
    </Row>
  );
};

export default EquipmentSummary;
