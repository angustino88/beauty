/* eslint-disable react-refresh/only-export-components */
import { CheckCircleFilled, ExclamationCircleFilled, WarningFilled } from "@ant-design/icons";
import { Popover, Tag, Tooltip } from "antd";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type {
  MappingEquipmentItem,
  MappingLicenseItem,
  MappingState,
  ResourceMappingRow,
} from "../types";
import { MAPPING_STATE_LABELS } from "../utils/mappingExportConfig";
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

const CATEGORY_ICONS: Record<string, ReactNode> = {
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
};

export const ENTITY_PATHS = {
  room: "/spaces/room",
  station: "/spaces/station",
  bench: "/spaces/bench",
  license: "/lab-equipment/license",
} as const;

const categoryKey = (item: MappingEquipmentItem) => (item.category?.name || "Other").toLowerCase();
export const categoryIcon = (key: string) => CATEGORY_ICONS[key] ?? <AccessoriesIcon />;
export const categoryPath = (key: string) => `/lab-equipment/${CATEGORY_ICONS[key] ? key : "other"}`;

/** A linked resource: SKU on the first line, name on the second, an optional location line. */
export const MappingAsset = ({
  sku,
  name,
  meta,
  path,
  icon,
}: {
  sku?: string | null;
  name?: string | null;
  meta?: string | null;
  path: string;
  icon: ReactNode;
}) => {
  const primary = sku || name || "—";
  const secondary = sku && name && name !== sku ? name : null;
  return (
    <Link
      className={styles.asset}
      aria-label={`Open ${[primary, secondary].filter(Boolean).join(", ")}`}
      title={[secondary ? `${secondary} (${primary})` : primary, meta].filter(Boolean).join(" · ")}
      to={`${path}?q=${encodeURIComponent(sku || name || "")}`}
    >
      <span className={styles.assetIcon} aria-hidden="true">{icon}</span>
      <span className={styles.assetText}>
        <strong className={styles.assetSku}>{primary}</strong>
        {secondary && <span>{secondary}</span>}
        {meta && <span className={styles.assetMeta}>{meta}</span>}
      </span>
    </Link>
  );
};

export const EmptyMapping = ({ label }: { label: string }) => (
  <span className={styles.emptyMapping}>{label}</span>
);

const STATE_ICONS: Record<MappingState, ReactNode> = {
  fully_mapped: <CheckCircleFilled aria-hidden="true" />,
  needs_equipment: <ExclamationCircleFilled aria-hidden="true" />,
  needs_placement: <WarningFilled aria-hidden="true" />,
};

export const MappingStateTag = ({ state }: { state: MappingState }) => (
  <span className={styles.stateTag} data-state={state}>
    {STATE_ICONS[state]}
    {MAPPING_STATE_LABELS[state]}
  </span>
);

export const renderMappingStatus = (row: ResourceMappingRow) => {
  const { state, equipment_count, license_count, has_station } = row.status;
  const hint = state === "needs_placement"
    ? (has_station ? "Station is not in a room" : "No station")
    : `${equipment_count} unit${equipment_count === 1 ? "" : "s"} · ${license_count} licence${license_count === 1 ? "" : "s"}`;
  return (
    <span className={styles.mappingStatus}>
      <MappingStateTag state={state} />
      <small>{hint}</small>
    </span>
  );
};

export const renderBenchTag = (row: ResourceMappingRow) => (
  <MappingAsset sku={row.bench.sku} name={row.bench.name} path={ENTITY_PATHS.bench} icon={<ComputerIcon />} />
);

export const renderStationTag = (row: ResourceMappingRow) => {
  if (!row.station) return <EmptyMapping label="Not placed" />;
  return (
    <MappingAsset
      sku={row.station.sku}
      name={row.station.name}
      meta={row.station_slot ? `Slot ${row.station_slot.slot_code}` : null}
      path={ENTITY_PATHS.station}
      icon={<RackIcon />}
    />
  );
};

export const renderRoomTag = (row: ResourceMappingRow) => {
  if (!row.room) return <EmptyMapping label={row.station ? "Station has no room" : "—"} />;
  return (
    <MappingAsset
      sku={row.room.sku}
      name={row.room.name}
      meta={row.room_slot ? `Slot ${row.room_slot.slot_code}` : null}
      path={ENTITY_PATHS.room}
      icon={<LabIcon />}
    />
  );
};

const EquipmentList = ({ equipment }: { equipment: MappingEquipmentItem[] }) => (
  <div className={styles.popoverList}>
    {equipment.map((item) => {
      const key = categoryKey(item);
      return (
        <MappingAsset
          key={item.id}
          sku={item.sku}
          name={item.name}
          meta={[item.category.name, item.role && item.role !== "default" ? item.role : null].filter(Boolean).join(" · ")}
          path={categoryPath(key)}
          icon={categoryIcon(key)}
        />
      );
    })}
  </div>
);

export const renderEquipmentCategories = (equipment: MappingEquipmentItem[]) => {
  if (!equipment.length) return <EmptyMapping label="No equipment" />;
  const byCategory = new Map<string, { label: string; count: number }>();
  for (const item of equipment) {
    const key = categoryKey(item);
    const entry = byCategory.get(key) ?? { label: item.category.name || "Other", count: 0 };
    entry.count += 1;
    byCategory.set(key, entry);
  }
  return (
    <Popover content={<EquipmentList equipment={equipment} />} title={`${equipment.length} units on this bench`}>
      <span className={styles.categoryChips} tabIndex={0}>
        {[...byCategory.entries()].map(([key, { label, count }]) => (
          <span key={key} className={styles.categoryChip}>
            <span className={styles.chipIcon} aria-hidden="true">{categoryIcon(key)}</span>
            {label}
            <strong>{count}</strong>
          </span>
        ))}
      </span>
    </Popover>
  );
};

const MAX_LICENSE_TAGS = 2;

export const renderLicenses = (licenses: MappingLicenseItem[]) => {
  if (!licenses.length) return <EmptyMapping label="—" />;
  const shown = licenses.slice(0, MAX_LICENSE_TAGS);
  const hidden = licenses.slice(MAX_LICENSE_TAGS);
  return (
    <span className={styles.categoryChips}>
      {shown.map((license) => (
        <Tooltip key={`${license.id}-${license.equipment_id}`} title={`${license.name} (${license.sku})`}>
          <Link to={`${ENTITY_PATHS.license}?q=${encodeURIComponent(license.sku || license.name)}`}>
            <Tag icon={<span className={styles.chipIcon}><LicenseIcon /></span>} className={styles.licenseTag}>
              {license.sku || license.name}
            </Tag>
          </Link>
        </Tooltip>
      ))}
      {hidden.length > 0 && (
        <Tooltip title={hidden.map((license) => license.sku || license.name).join(", ")}>
          <Tag>+{hidden.length}</Tag>
        </Tooltip>
      )}
    </span>
  );
};
