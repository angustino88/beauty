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
