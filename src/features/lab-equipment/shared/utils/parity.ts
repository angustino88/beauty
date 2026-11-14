type UnknownRecord = Record<string, unknown>;
import { equipmentStatusValue } from './equipmentStatus';

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Lifecycle options from the equipment change-status contract. */
export const EQUIPMENT_STATUS_FILTER_OPTIONS = [
  { text: "In Use", value: "in_use" },
  { text: "Available", value: "available" },
  { text: "Transferred", value: "transferred" },
  { text: "Borrowed", value: "borrowed" },
  { text: "Maintenance", value: "maintenance" },
  { text: "Broken", value: "broken" },
  { text: "Calibration Overdue", value: "calibration_overdue" },
  { text: "Lost", value: "lost" },
  { text: "Retired", value: "retired" },
  { text: "On Order", value: "on_order" },
];

/** Hardcoded status filter options for Computer page (from RemoteComputerActivity.status). */
export const COMPUTER_STATUS_FILTER_OPTIONS = [
  { text: "Free", value: "free" },
  { text: "Active", value: "active" },
  { text: "Offline", value: "offline" },
  { text: "Inactive", value: "inactive" },
  { text: "Maintaining", value: "maintaining" },
];

/** Hardcoded status filter options for License page (from backend STATUS_TYPES). */
export const LICENSE_STATUS_FILTER_OPTIONS = [
  { text: "Active", value: "active" },
  { text: "Inactive", value: "inactive" },
  { text: "Deactivated", value: "deactivated" },
  { text: "Revoked", value: "revoked" },
  { text: "Expired", value: "expired" },
  { text: "Trial", value: "trial" },
  { text: "Suspended", value: "suspended" },
];

export const ROOM_STATUS_FILTER_OPTIONS = [
  { text: "Available", value: "available" },
  { text: "In Use", value: "in_use" },
  { text: "Reserved", value: "reserved" },
  { text: "Maintenance", value: "maintenance" },
  { text: "Issue", value: "issue" },
  { text: "Restricted", value: "restricted" },
  { text: "Closed", value: "closed" },
];

export const RACK_STATUS_FILTER_OPTIONS = [
  { text: "Available", value: "available" },
  { text: "In Use", value: "in_use" },
  { text: "Reserved", value: "reserved" },
  { text: "Maintenance", value: "maintenance" },
  { text: "Issue", value: "issue" },
  { text: "Retired", value: "retired" },
];
export const normalizeStatusValue = (value: unknown) =>
  equipmentStatusValue(value);

export const readStatusFromRecord = (record: unknown) => {
  if (!isRecord(record)) return "";

  const currentStatus = isRecord(record.current_status)
    ? record.current_status
    : null;
  return normalizeStatusValue(
    record.status ??
    currentStatus?.status_type ??
      currentStatus?.status ??
      '',
  );
};

export const readStatusDataFromRecord = (record: unknown): UnknownRecord => {
  if (!isRecord(record)) return {};

  const currentStatus = isRecord(record.current_status)
    ? record.current_status
    : null;
  if (!currentStatus) return {};

  if (isRecord(currentStatus.status_data)) return currentStatus.status_data;
  return currentStatus;
};

export const buildEquipmentInfo = (record: unknown): string => {
  const status = readStatusFromRecord(record);
  const statusData = readStatusDataFromRecord(record);

  const computerName = isRecord(record)
    ? record.computer_name ??
      (isRecord(record.computer) ? record.computer.computer_name : undefined) ??
      (isRecord(record.lab_equipment) && isRecord(record.lab_equipment.computer)
        ? record.lab_equipment.computer.computer_name
        : undefined) ??
      statusData.computer_name
    : undefined;

  switch (status) {
    case "available":
    case "free":
    case "active":
    case "online":
      return "Ready for use";
    case "in_use":
    case "occupied":
      return [
        `Lab: ${String(statusData.lab_name ?? "")}`.trim(),
        computerName !== null && computerName !== undefined && computerName !== ""
          ? `(${String(computerName)})`
          : "",
      ].filter(Boolean).join(" ");
    case "in_storage":
      return `Location: ${String(statusData.location ?? "")}`.trim();
    case "transferred":
      return `Transfer to: ${String(statusData.transfer_to ?? "")}`.trim();
    case "borrowed":
      return `Borrower: ${String(statusData.borrower ?? "")}`.trim();
    case "maintenance":
      return `Reason: ${String(statusData.reason ?? "")}`.trim();
    case "broken":
    case "lost":
      return String(statusData.description ?? "");
    case "on_order":
      return String(statusData.status ?? "");
    default:
      return "";
  }
};

export const sortRowsByIdAsc = <T extends { id: number | string }>(rows: T[]) =>
  [...rows].sort((a, b) => Number(a.id) - Number(b.id));

export const isSummaryConsistent = (
  summary: Record<string, unknown> | undefined,
  statusKeys: string[],
) => {
  if (!summary) return false;
  const total = Number(summary.total);
  if (!Number.isFinite(total) || total < 0) return false;

  let known = 0;
  for (const key of statusKeys) {
    const value = Number(summary[key] ?? 0);
    if (!Number.isFinite(value) || value < 0) return false;
    if (value > total) return false;
    known += value;
  }

  return known <= total;
};

export const summarizeHardwareRows = (rows: unknown[], totalCount?: number) => {
  let inUse = 0;
  let available = 0;
  let borrowed = 0;
  let inStorage = 0;

  for (const row of rows) {
    const status = readStatusFromRecord(row);
    if (status === "in_use" || status === "occupied") inUse += 1;
    else if (
      status === "available" ||
      status === "free" ||
      status === "active" ||
      status === "online"
    )
      available += 1;
    else if (status === "borrowed") borrowed += 1;
    else if (status === "in_storage") inStorage += 1;
  }

  return {
    total: totalCount ?? rows.length,
    in_use: inUse,
    available,
    borrowed,
    in_storage: inStorage,
    others: Math.max(
      0,
      (totalCount ?? rows.length) - inUse - available - borrowed - inStorage,
    ),
  };
};

/**
 * Summarize Computer rows using RemoteComputerActivity statuses.
 * Computer's current_status.status comes from RemoteComputerActivity (free/active/offline/inactive/maintaining)
 * which is different from the equipment display_status used by other equipment pages.
 * We map these to the EQUIPMENT_STATUS_CARDS format: Total/In use/Available/Borrowed/Others.
 *   - "active" → In Use (computer is actively being used)
 *   - "free" → Available (computer is ready)
 *   - "offline","inactive","maintaining" → Others
 */
export const summarizeComputerRows = (rows: unknown[], totalCount?: number) => {
  let inUse = 0;
  let available = 0;
  let others = 0;

  for (const row of rows) {
    const status = readStatusFromRecord(row);
    if (status === "active") inUse += 1;
    else if (status === "free") available += 1;
    else others += 1;
  }

  return {
    total: totalCount ?? rows.length,
    in_use: inUse,
    available,
    borrowed: 0,
    in_storage: 0,
    others,
  };
};

export const summarizeLicenseRows = (rows: unknown[], totalCount?: number) => {
  let active = 0;
  let inactive = 0;
  let expired = 0;
  let trial = 0;

  for (const row of rows) {
    const status = readStatusFromRecord(row);
    if (
      status === "active" ||
      status === "available" ||
      status === "free" ||
      status === "online"
    )
      active += 1;
    else if (
      status === "inactive" ||
      status === "deactivated" ||
      status === "suspended" ||
      status === "offline"
    )
      inactive += 1;
    else if (status === "expired" || status === "revoked") expired += 1;
    else if (status === "trial") trial += 1;
  }

  return {
    total: totalCount ?? rows.length,
    active,
    inactive,
    expired,
    trial,
    others: Math.max(
      0,
      (totalCount ?? rows.length) - active - inactive - expired - trial,
    ),
  };
};
