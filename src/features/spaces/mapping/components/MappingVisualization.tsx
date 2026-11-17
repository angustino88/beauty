import {
  ReloadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { Button, Empty, Pagination, Skeleton } from "antd";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
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
import { MAPPING_STATE_LABELS } from "../utils/mappingExportConfig";
import styles from "./MappingVisualization.module.css";

let rememberedZoom = 1;

export interface MappingVisualizationProps {
  rows: ResourceMappingRow[];
  loading: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  showPagination?: boolean;
  compact?: boolean;
  selectedDeviceType?: string;
  selectedDeviceId?: number;
}

type AssetTone =
  | "lab"
  | "rack"
  | "computer"
  | "sample"
  | "network"
  | "debug"
  | "power"
  | "monitor"
  | "accessory"
  | "license"
  | "bench"
  | "furniture"
  | "instrument"
  | "laboratory"
  | "mechanical"
  | "other"
  | "empty";

const CATEGORY_TONE_MAP: Record<string, AssetTone> = {
  computing: "computer",
  display: "monitor",
  debugging: "debug",
  networking: "network",
  power: "power",
  accessory: "accessory",
  sample: "sample",
  furniture: "furniture",
  instrument: "instrument",
  laboratory: "laboratory",
  mechanical: "mechanical",
  other: "other",
};

const CATEGORY_ICON_MAP: Record<string, ReactNode> = {
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
};

const CATEGORY_PATH_MAP: Record<string, string> = {
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
};

const Node = ({
  icon,
  type,
  name,
  sku,
  path,
  tone,
  subLabel,
  muted = false,
  compact = false,
  selected = false,
}: {
  icon: ReactNode;
  type: string;
  name: string | null;
  sku: string | null;
  path: string;
  tone: AssetTone;
  subLabel?: string | null;
  muted?: boolean;
  compact?: boolean;
  selected?: boolean;
}) => {
  const content = (
    <>
      <span className={styles.nodeIcon}>{icon}</span>
      <span className={styles.nodeText}>
        {!compact && <span className={styles.nodeType}>{type}</span>}
        <strong title={name ?? undefined}>{name || "Not mapped"}</strong>
        {sku && <span className={styles.sku}>{subLabel ? `${subLabel} · ${sku}` : sku}</span>}
      </span>
    </>
  );

  const className = `${styles.node} ${muted ? styles.mutedNode : ""} ${compact ? styles.compactNode : ""} ${selected ? styles.selectedNode : ""}`;
  const ariaLabel = `${type}: ${name || "Not mapped"}${sku ? `, ${sku}` : ""}`;

  if (muted) {
    return (
      <div className={className} data-tone={tone} aria-label={ariaLabel} aria-current={selected ? "true" : undefined}>
        {content}
      </div>
    );
  }

  return (
    <Link
      className={className}
      data-tone={tone}
      aria-label={`View ${ariaLabel}`}
      aria-current={selected ? "true" : undefined}
      to={`${path}?q=${encodeURIComponent(sku || name || "")}`}
    >
      {content}
    </Link>
  );
};

const MappingLane = ({
  row,
  compact = false,
  selectedDeviceType,
  selectedDeviceId,
}: {
  row: ResourceMappingRow;
  compact?: boolean;
  selectedDeviceType?: string;
  selectedDeviceId?: number;
}) => {
  const isSelected = (type: string, id: number | undefined) =>
    selectedDeviceType === type && id === selectedDeviceId;

  const equipmentByCategory = new Map<string, MappingEquipmentItem[]>();
  for (const eq of row.equipment) {
    const catName = eq.category?.name || "Other";
    const list = equipmentByCategory.get(catName) ?? [];
    list.push(eq);
    equipmentByCategory.set(catName, list);
  }

  const licensesByEquipment = new Map<number, MappingLicenseItem[]>();
  for (const lic of row.licenses) {
    const list = licensesByEquipment.get(lic.equipment_id) ?? [];
    list.push(lic);
    licensesByEquipment.set(lic.equipment_id, list);
  }

  return (
    <section className={styles.lane}>
      {/* 1. Room Node */}
      <div className={styles.labNode}>
        <Node
          icon={<LabIcon />}
          type="Room"
          name={row.room?.name ?? null}
          sku={row.room?.sku ?? null}
          subLabel={row.room_slot ? `Slot ${row.room_slot.slot_code}` : null}
          path="/spaces/room"
          tone="lab"
          muted={!row.room}
          compact={compact}
          selected={isSelected("room", row.room?.id)}
        />
        <span className={styles.mappingStatus}>
          <span className={`${styles.statusDot} ${row.status.is_fully_mapped ? styles.completeDot : styles.partialDot}`} />
          {MAPPING_STATE_LABELS[row.status.state]}
        </span>
        <span className={styles.detailCount}>{row.status.equipment_count} assets · {row.status.license_count} licences</span>
      </div>

      <div className={styles.connector} aria-hidden="true" />

      {/* 2. Station & Bench Nodes */}
      <div className={styles.coreNodes}>
        <Node
          icon={<RackIcon />}
          type="Station"
          name={row.station?.name ?? null}
          sku={row.station?.sku ?? null}
          subLabel={row.station_slot ? `Slot ${row.station_slot.slot_code}` : null}
          path="/spaces/station"
          tone="rack"
          muted={!row.station}
          compact={compact}
          selected={isSelected("station", row.station?.id)}
        />
        <Node
          icon={<ComputerIcon />}
          type="Bench"
          name={row.bench.name}
          sku={row.bench.sku}
          path="/spaces/bench"
          tone="bench"
          compact={compact}
          selected={isSelected("bench", row.bench.id)}
        />
      </div>

      <div className={styles.connector} aria-hidden="true" />

      {/* 3. Equipment & License Nodes */}
      <div className={styles.equipmentLicenseMap}>
        {row.equipment.length === 0 ? (
          <Node
            icon={<AccessoriesIcon />}
            type="Equipment"
            name={null}
            sku={null}
            path="/lab-equipment/accessory"
            tone="empty"
            muted
            compact={compact}
          />
        ) : (
          <div className={styles.connectionRows}>
            {Array.from(equipmentByCategory.entries()).map(([categoryName, items]) => {
              const catKey = categoryName.toLowerCase();
              const tone = CATEGORY_TONE_MAP[catKey] ?? "accessory";
              const icon = CATEGORY_ICON_MAP[catKey] ?? <AccessoriesIcon />;
              const path = CATEGORY_PATH_MAP[catKey] ?? "/lab-equipment/accessory";

              return (
                <div key={categoryName} className={styles.deviceGroup} data-tone={tone}>
                  <div className={styles.deviceGroupHeader}>
                    <span>{categoryName}</span>
                    <strong>{items.length}</strong>
                  </div>
                  <div className={styles.deviceGroupList}>
                    {items.map((eq) => {
                      const attachedLicenses = licensesByEquipment.get(eq.id) ?? [];
                      const hasLicenses = attachedLicenses.length > 0;

                      return (
                        <div
                          key={eq.id}
                          className={styles.connectionRow}
                          data-has-licenses={hasLicenses ? "true" : "false"}
                        >
                          <Node
                            icon={icon}
                            type={eq.role ? `${categoryName} (${eq.role})` : categoryName}
                            name={eq.name}
                            sku={eq.sku}
                            path={path}
                            tone={tone}
                            compact={compact}
                            selected={isSelected(catKey, eq.id)}
                          />

                          {hasLicenses && (
                            <>
                              <div className={styles.blockConnector}>
                                <span>{attachedLicenses.length} lic</span>
                              </div>
                              <div className={styles.licenseGroup}>
                                <div className={styles.licenseGroupHeader}>
                                  <span>Licenses</span>
                                  <strong>{attachedLicenses.length}</strong>
                                </div>
                                <div className={styles.licenseGroupList}>
                                  {attachedLicenses.map((lic) => (
                                    <Node
                                      key={lic.id}
                                      icon={<LicenseIcon />}
                                      type="License"
                                      name={lic.name}
                                      sku={lic.sku}
                                      path="/lab-equipment/license"
                                      tone="license"
                                      compact
                                      selected={isSelected("license", lic.id)}
                                    />
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export const MappingVisualization = ({
  rows,
  loading,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  showPagination = true,
  compact = false,
  selectedDeviceType,
  selectedDeviceId,
}: MappingVisualizationProps) => {
  const [zoom, setZoom] = useState(() => (compact ? 1 : rememberedZoom));
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!compact) {
      rememberedZoom = zoom;
    }
  }, [zoom, compact]);

  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.1).toFixed(1)), 1.6));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.1).toFixed(1)), 0.6));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className={`${styles.visualization} ${compact ? styles.compactVisualization : ""}`}>
      <div className={styles.diagramStage}>
        {!compact && (
          <div className={styles.zoomToolbar} role="toolbar" aria-label="Diagram zoom controls">
            <Button
              type="text"
              size="small"
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              disabled={zoom <= 0.6}
              title="Zoom out"
            />
            <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
            <Button
              type="text"
              size="small"
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              disabled={zoom >= 1.6}
              title="Zoom in"
            />
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleZoomReset}
              disabled={zoom === 1}
              title="Reset zoom"
            />
          </div>
        )}

        <div className={styles.diagramViewport} ref={viewportRef}>
          <div
            className={styles.diagramCanvas}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            <div className={styles.columnLabels} aria-hidden="true">
              <span>Room Location</span>
              <span>Station & Bench</span>
              <span>Assigned Equipment & Software</span>
            </div>

            {loading ? (
              <div className={styles.lanes}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className={styles.lane}>
                    <Skeleton active paragraph={{ rows: 2 }} />
                    <div className={styles.connector} />
                    <Skeleton active paragraph={{ rows: 2 }} />
                    <div className={styles.connector} />
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <Empty
                className={styles.empty}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No resource mappings found"
              />
            ) : (
              <div className={styles.lanes}>
                {rows.map((row) => (
                  <MappingLane
                    key={row.id}
                    row={row}
                    compact={compact}
                    selectedDeviceType={selectedDeviceType}
                    selectedDeviceId={selectedDeviceId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPagination && total > 0 && onPageChange && (
        <div className={styles.pagination}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={["5", "10", "20", "50"]}
            onChange={onPageChange}
            showTotal={(t) => `Total ${t} items`}
          />
        </div>
      )}
    </div>
  );
};
