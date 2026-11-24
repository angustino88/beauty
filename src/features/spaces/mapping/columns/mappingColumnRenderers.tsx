/* eslint-disable react-refresh/only-export-components */
import { CheckCircleFilled, ExclamationCircleFilled, RightOutlined, WarningFilled } from "@ant-design/icons";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type {
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
      aria-label={`Open ${[primary, secondary, meta].filter(Boolean).join(", ")}`}
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
  const { state, has_station } = row.status;
  const hint = state === "needs_placement" ? (has_station ? "Station is not in a room" : "No station") : null;
  return (
    <span className={styles.mappingStatus}>
      <MappingStateTag state={state} />
      {hint && <small>{hint}</small>}
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

export type MappingAssetKind = "equipment" | "licenses";

export const MappingAssetSummary = ({ row, kind, onOpen }: {
  row: ResourceMappingRow;
  kind: MappingAssetKind;
  onOpen: () => void;
}) => {
  const isLicense = kind === "licenses";
  const count = isLicense ? new Set(row.licenses.map((license) => license.id)).size : row.equipment.length;
  if (!count) return <EmptyMapping label={isLicense ? "No licenses" : "No equipment"} />;

  const noun = isLicense ? "license" : "unit";
  const label = `${count} ${noun}${count === 1 ? "" : "s"}`;

  return (
    <button
      type="button"
      className={styles.assetSummary}
      data-kind={kind}
      aria-haspopup="dialog"
      aria-label={`View ${label} on ${row.bench.sku || row.bench.name}`}
      onClick={onOpen}
    >
      <span className={styles.summaryIcon} aria-hidden="true">{isLicense ? <LicenseIcon /> : <ComputingIcon />}</span>
      {label}
      <RightOutlined className={styles.summaryChevron} aria-hidden="true" />
    </button>
  );
};
