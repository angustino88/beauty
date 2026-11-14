import { StatusBadge } from "@/shared/components/StatusBadge";
/* eslint-disable react-refresh/only-export-components */
import { CheckCircleFilled, ExclamationCircleFilled } from "@ant-design/icons";
import { Badge, Popover, Space, Tag, Tooltip } from "antd";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type {
  MappingEquipmentItem,
  MappingLicenseItem,
  ResourceMappingRow,
} from "../types";
import {
  AccessoriesIcon,
  ComputerIcon,
  DebugHardwareIcon,
  LabIcon,
  LicenseIcon,
  MonitorIcon,
  NetworkInterfaceIcon,
  PowerSupplyIcon,
  RackIcon,
  SampleIcon,
} from "@/features/lab-equipment/shared/components/EquipmentIcons";
import styles from "./MappingTable.module.css";

export type MappingTagTone =
  | "lab"
  | "rack"
  | "computer"
  | "sample"
  | "network"
  | "debug"
  | "power"
  | "monitor"
  | "accessory";

const TAG_ICONS: Record<string, ReactNode> = {
  room: <LabIcon />,
  station: <RackIcon />,
  bench: <ComputerIcon />,
  computing: <ComputerIcon />,
  display: <MonitorIcon />,
  debugging: <DebugHardwareIcon />,
  networking: <NetworkInterfaceIcon />,
  power: <PowerSupplyIcon />,
  accessory: <AccessoriesIcon />,
  sample: <SampleIcon />,
  furniture: <RackIcon />,
  instrument: <DebugHardwareIcon />,
  laboratory: <LabIcon />,
  mechanical: <PowerSupplyIcon />,
  other: <AccessoriesIcon />,
  license: <LicenseIcon />,
};

const CATEGORY_TONES: Record<string, MappingTagTone> = {
  computing: "computer",
  display: "monitor",
  debugging: "debug",
  networking: "network",
  power: "power",
  accessory: "accessory",
  sample: "sample",
  furniture: "accessory",
  instrument: "debug",
  laboratory: "lab",
  mechanical: "power",
  other: "accessory",
};

const ENTITY_PATHS: Record<string, string> = {
  room: "/spaces/room",
  station: "/spaces/station",
  bench: "/spaces/bench",
  computing: "/lab-equipment/computing",
  display: "/lab-equipment/display",
  debugging: "/lab-equipment/debugging",
  networking: "/lab-equipment/networking",
  power: "/lab-equipment/power",
  accessory: "/lab-equipment/accessory",
  sample: "/lab-equipment/sample",
  furniture: "/lab-equipment/furniture",
  instrument: "/lab-equipment/instrument",
  laboratory: "/lab-equipment/laboratory",
  mechanical: "/lab-equipment/mechanical",
  other: "/lab-equipment/other",
  license: "/lab-equipment/license",
};

export const MappingAsset = ({
  sku,
  name,
  tone,
  subLabel,
  path = "/lab-equipment/mapping",
  icon,
}: {
  sku?: string | null;
  name?: string | null;
  tone: MappingTagTone;
  subLabel?: string | null;
  path?: string;
  icon?: ReactNode;
}) => (
  <Tooltip title={name && sku ? `${name} (${sku})${subLabel ? ` [${subLabel}]` : ""}` : undefined}>
    <Link
      className={styles.asset}
      data-tone={tone}
      aria-label={`View ${name || sku}`}
      to={`${path}?search=${encodeURIComponent(sku || name || "")}`}
    >
      <span className={styles.assetIcon} aria-hidden="true">
        {icon ?? TAG_ICONS[tone] ?? <AccessoriesIcon />}
      </span>
      <span className={styles.assetText}>
        <strong>{name || sku}</strong>
        <span>{subLabel ? `${subLabel} · ${sku || ""}` : sku || ""}</span>
      </span>
    </Link>
  </Tooltip>
);

export const EmptyMapping = ({ label = "Not mapped" }: { label?: string }) => (
  <span className={styles.emptyMapping}>{label}</span>
);

export const renderMappingStatus = (row: ResourceMappingRow) => {
  const { is_fully_mapped, has_station, has_room, equipment_count, license_count } = row.status;
  const missingParts = [
    !has_room ? "No room" : null,
    !has_station ? "No station" : null,
    equipment_count === 0 ? "Empty bench" : null,
  ].filter(Boolean);
  const supplemental = [
    row.bench.criticality ? `Criticality: ${row.bench.criticality}` : null,
    row.bench.requested_power_w != null ? `${row.bench.requested_power_w} W` : null,
    row.bench.requested_load_kg != null ? `${row.bench.requested_load_kg} kg load` : null,
    row.bench.requested_cooling_w != null ? `${row.bench.requested_cooling_w} W cooling` : null,
    ...(Array.isArray(row.bench.required_utilities) ? row.bench.required_utilities : row.bench.required_utilities ? [row.bench.required_utilities] : []),
  ].filter(Boolean);
  const entityStatus = row.bench.status;

  return (
    <div className={styles.mappingStatusDetails}>
      <span className={styles.mappingStatus} style={{ color: is_fully_mapped ? "var(--lm-success-fg)" : "var(--lm-warning-fg)" }}>
        {is_fully_mapped ? <CheckCircleFilled aria-hidden="true" /> : <ExclamationCircleFilled aria-hidden="true" />}
        <span>
          <strong>{is_fully_mapped ? "Fully mapped" : missingParts[0] ?? "Partial"}</strong>
          <small>{equipment_count} eq · {license_count} lic{!is_fully_mapped && missingParts.length > 1 ? ` · ${missingParts.slice(1).join(", ")}` : ""}</small>
        </span>
      </span>
      {entityStatus && <StatusBadge fit status={entityStatus} label={`Bench: ${entityStatus}`} />}
      {supplemental.length > 0 && (
        <Tooltip title={supplemental.join(" · ")}>
          <small className={styles.mappingSupplemental}>{supplemental.join(" · ")}</small>
        </Tooltip>
      )}
      {row.bench.remark && (
        <Tooltip title={row.bench.remark}>
          <small className={styles.mappingSupplemental}>{row.bench.remark}</small>
        </Tooltip>
      )}
    </div>
  );
};

export const renderRoomTag = (row: ResourceMappingRow) => {
  if (!row.room) return <EmptyMapping label="No room placed" />;
  const slotText = row.room_slot ? `Slot ${row.room_slot.slot_code}` : null;
  return (
    <MappingAsset
      sku={row.room.sku}
      name={row.room.name}
      tone="lab"
      subLabel={slotText}
      path={ENTITY_PATHS.room}
      icon={TAG_ICONS.room}
    />
  );
};

export const renderStationTag = (row: ResourceMappingRow) => {
  if (!row.station) return <EmptyMapping label="No station placed" />;
  const slotText = row.station_slot ? `Slot ${row.station_slot.slot_code}` : null;
  return (
    <MappingAsset
      sku={row.station.sku}
      name={row.station.name}
      tone="rack"
      subLabel={slotText}
      path={ENTITY_PATHS.station}
      icon={TAG_ICONS.station}
    />
  );
};

export const renderBenchTag = (row: ResourceMappingRow) => {
  return (
    <MappingAsset
      sku={row.bench.sku}
      name={row.bench.name}
      tone="computer"
      path={ENTITY_PATHS.bench}
      icon={TAG_ICONS.bench}
    />
  );
};

export const renderEquipmentCategories = (equipment: MappingEquipmentItem[]) => {
  if (!equipment || equipment.length === 0) {
    return <EmptyMapping label="No equipment assigned" />;
  }

  const countsByCategory = new Map<string, { count: number; items: MappingEquipmentItem[] }>();
  for (const item of equipment) {
    const catKey = (item.category?.name || "Other").toLowerCase();
    const existing = countsByCategory.get(catKey) ?? { count: 0, items: [] };
    existing.count += 1;
    existing.items.push(item);
    countsByCategory.set(catKey, existing);
  }

  const popoverContent = (
    <div style={{ maxWidth: 360, maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
      {equipment.map((eq) => {
        const catKey = (eq.category?.name || "other").toLowerCase();
        const tone = CATEGORY_TONES[catKey] ?? "accessory";
        return (
          <MappingAsset
            key={eq.id}
            sku={eq.sku}
            name={eq.name}
            tone={tone}
            subLabel={eq.role ? `${eq.category.name} (${eq.role})` : eq.category.name}
            path={ENTITY_PATHS[catKey] ?? ENTITY_PATHS.accessory}
            icon={TAG_ICONS[catKey] ?? TAG_ICONS.other}
          />
        );
      })}
    </div>
  );

  return (
    <Popover content={popoverContent} title="Assigned Equipment" trigger="hover">
      <Space wrap size={[4, 4]}>
        {Array.from(countsByCategory.entries()).map(([catKey, data]) => {
          const displayName = catKey.charAt(0).toUpperCase() + catKey.slice(1);
          return (
            <Tag key={catKey} color="blue" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11 }}>{displayName}</span>
              <Badge count={data.count} size="small" style={{ backgroundColor: "var(--lm-neutral-solid)" }} />
            </Tag>
          );
        })}
      </Space>
    </Popover>
  );
};

export const renderLicenses = (licenses: MappingLicenseItem[]) => {
  if (!licenses || licenses.length === 0) {
    return <EmptyMapping label="No licenses" />;
  }

  return (
    <Space wrap size={[4, 4]}>
      {licenses.map((lic) => (
        <Tooltip key={lic.id} title={`License: ${lic.name} (${lic.sku})`}>
          <Tag color="gold" style={{ cursor: "pointer" }}>
            <Link to={`${ENTITY_PATHS.license}?search=${encodeURIComponent(lic.sku || lic.name)}`} style={{ color: "inherit" }}>
              {lic.name || lic.sku}
            </Link>
          </Tag>
        </Tooltip>
      ))}
    </Space>
  );
};
