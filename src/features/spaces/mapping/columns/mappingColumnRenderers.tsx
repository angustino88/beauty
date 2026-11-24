/* eslint-disable react-refresh/only-export-components */
import { CheckCircleFilled, ExclamationCircleFilled, WarningFilled } from "@ant-design/icons";
import { Popover, Tag, Tooltip } from "antd";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ResourceBadge } from "@/components/display/ResourceBadge";
import type {
  MappingEquipmentItem,
  MappingLicenseItem,
  MappingState,
  ResourceMappingRow,
} from "../types";
import { MAPPING_STATE_LABELS } from "../utils/mappingExportConfig";
import {
  AccessoryIcon,
  ComputingIcon,
  DebuggingIcon,
  DisplayIcon,
  FurnitureIcon,
  LabIcon,
  LicenseIcon,
  NetworkingIcon,
  PowerIcon,
  SampleIcon,
  StationIcon,
} from "@/features/lab-equipment/shared/components/EquipmentIcons";
import { useCategoryKeyById } from "../hooks/useCategoryKeyById";
import { resolveCategoryKey } from "../utils/categoryKey";
import styles from "./MappingTable.module.css";

const CATEGORY_ICONS: Record<string, ReactNode> = {
  computing: <ComputingIcon />,
  display: <DisplayIcon />,
  debugging: <DebuggingIcon />,
  networking: <NetworkingIcon />,
  power: <PowerIcon />,
  accessory: <AccessoryIcon />,
  sample: <SampleIcon />,
  furniture: <FurnitureIcon />,
  instrument: <DebuggingIcon />,
  laboratory: <LabIcon />,
  mechanical: <PowerIcon />,
};

export const ENTITY_PATHS = {
  room: "/spaces/room",
  station: "/spaces/station",
  bench: "/spaces/bench",
  license: "/lab-equipment/license",
} as const;

export const categoryIcon = (key: string | null) => (key && CATEGORY_ICONS[key]) || <AccessoryIcon />;
/** Equipment page of a category key; categories without a page get no link. */
export const categoryPath = (key: string | null) => (key ? `/lab-equipment/${key}` : null);

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
  /** Page to open; without one the asset is shown but not linked. */
  path?: string | null;
  icon: ReactNode;
}) => {
  const primary = sku || name || "—";
  const secondary = sku && name && name !== sku ? name : null;
  if (!path) {
    return (
      <span className={styles.asset} title={[secondary ? `${secondary} (${primary})` : primary, meta].filter(Boolean).join(" · ")}>
        <span className={styles.assetIcon} aria-hidden="true">{icon}</span>
        <span className={styles.assetText}>
          <strong className={styles.assetSku}>{primary}</strong>
          {secondary && <span>{secondary}</span>}
          {meta && <span className={styles.assetMeta}>{meta}</span>}
        </span>
      </span>
    );
  }
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
  <MappingAsset sku={row.bench.sku} name={row.bench.name} path={ENTITY_PATHS.bench} icon={<ComputingIcon />} />
);

export const renderStationTag = (row: ResourceMappingRow) => {
  if (!row.station) return <EmptyMapping label="Not placed" />;
  return (
    <MappingAsset
      sku={row.station.sku}
      name={row.station.name}
      meta={row.station_slot ? `Slot ${row.station_slot.slot_code}` : null}
      path={ENTITY_PATHS.station}
      icon={<StationIcon />}
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

const EquipmentList = ({ equipment, keyById }: { equipment: MappingEquipmentItem[]; keyById: ReadonlyMap<number, string> }) => (
  <div className={styles.popoverList}>
    {equipment.map((item) => {
      const key = resolveCategoryKey(item.category, keyById);
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

/** Category chips of a bench; grouped by the category's stable key, labelled with its name. */
const EquipmentCategories = ({ equipment }: { equipment: MappingEquipmentItem[] }) => {
  const keyById = useCategoryKeyById();
  if (!equipment.length) return <EmptyMapping label="No equipment" />;
  const byCategory = new Map<string, { key: string | null; label: string; count: number }>();
  for (const item of equipment) {
    const key = resolveCategoryKey(item.category, keyById);
    const groupId = key ?? `name:${item.category.name || "Other"}`;
    const entry = byCategory.get(groupId) ?? { key, label: item.category.name || "Other", count: 0 };
    entry.count += 1;
    byCategory.set(groupId, entry);
  }
  return (
    <Popover content={<EquipmentList equipment={equipment} keyById={keyById} />} title={`${equipment.length} units on this bench`}>
      <span className={styles.categoryChips} tabIndex={0}>
        {[...byCategory.entries()].map(([groupId, { key, label, count }]) => (
          <span key={groupId} className={styles.categoryChip}>
            <span className={styles.chipIcon} aria-hidden="true">{categoryIcon(key)}</span>
            {label}
            <strong>{count}</strong>
          </span>
        ))}
      </span>
    </Popover>
  );
};

export const renderEquipmentCategories = (equipment: MappingEquipmentItem[]) => <EquipmentCategories equipment={equipment} />;

const MAX_LICENSE_TAGS = 2;

export const renderLicenses = (licenses: MappingLicenseItem[]) => {
  if (!licenses.length) return <EmptyMapping label="—" />;
  const shown = licenses.slice(0, MAX_LICENSE_TAGS);
  const hidden = licenses.slice(MAX_LICENSE_TAGS);
  return (
    <span className={styles.categoryChips}>
      {shown.map((license) => (
        <Tooltip key={`${license.id}-${license.equipment_id}`} title={`${license.name} (${license.sku})`}>
          <Link className={styles.licenseLink} to={`${ENTITY_PATHS.license}?q=${encodeURIComponent(license.sku || license.name)}`}>
            <ResourceBadge kind="license" className={styles.licenseTag}>
              <span className={styles.chipIcon} aria-hidden="true"><LicenseIcon /></span>
              {license.sku || license.name}
            </ResourceBadge>
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
