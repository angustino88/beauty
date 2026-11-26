import type { RackStatus } from "./config/rackThresholds";

/** View model for a placed rack — consumed by all dashboard UI components. */
export interface RackData {
  id: number;
  name: string;
  temperature: number | null;
  humidity: number | null;
  powerUsage: number | null;
  status: RackStatus;
  position: [number, number, number] | null;
  slotCode: string | null;
  manufacturer: string | null;
  model: string | null;
  stationTypeId?: number | null;
  /** Library model this station shows (its own or its station type's). */
  visualModelId?: number | null;
  stationType: string | null;
  slots?: import('../spaces/room/stationContents').StationPosition[];
  modelKind: 'rack' | 'table' | 'cabinet' | 'shelf' | 'generic';
  dimensions: [number, number, number];
  rotation: number;
  benchCount: number | null;
  benchCapacity: number | null;
  /** Rated capacity and installed load (power, weight, rack units). */
  capacity?: import('../spaces/room/types').IDashboardStationCapacity;
  /** Rack-mounted equipment, bottom unit first. */
  rackItems?: import('../spaces/room/types').IDashboardRackItem[];
  /** When the newest live reading was taken, and how many channels report. */
  conditionsAt?: string | null;
  sensorCount?: number;
}

export interface SlotAnchor {
  id: number;
  rowIndex: number;
  colIndex: number;
  slotCode: string;
  position: [number, number, number];
  occupiedRackId: number | null;
  /** Footprint on the floor in scene units (metres on a measured plan). */
  size: [number, number];
  /** Rotation about the vertical axis, radians. */
  rotation: number;
  /** station, storage, aisle, safety, utility or reserved. */
  slotType: string;
  /** usable, blocked or retired. */
  status: string;
}

/** Floor size, and whether positions are measured (metres) or laid out on the row/column grid. */
export interface FloorSpec {
  measured: boolean;
  floorWidth: number;
  floorDepth: number;
  rows: number;
  cols: number;
}

/** Rack status counts used by TopBar alert badges. */
export interface NotificationCounts {
  unknown: number;
  ok: number;
  warning: number;
  critical: number;
}

/** Props for the RackBox 3-D component. */
export interface RackBoxProps {
  rack: RackData;
  slots: SlotAnchor[];
  isEditMode: boolean;
  isDeleteMode: boolean;
  onMove: (id: number, pos: [number, number, number]) => void;
  onDelete: (id: number) => void;
  onDragStateChange?: (id: number, dragging: boolean) => void;
  onNearestSlotChange?: (slotCode: string | null) => void;
  selected: boolean;
  showLabels: boolean;
  colorMode: 'status' | 'type';
  onSelect: (id: number) => void;
  pinned: boolean;
  onTogglePin: (id: number) => void;
  /** Metric shown as a column beside the station, as a 0–1 level; null hides it. */
  overlayLevel?: number | null;
  /** Another station is focused: fade this one back. */
  dimmed?: boolean;
}

/** Props for the Sidebar panel. */
export interface SidebarProps {
  racks: RackData[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  /** Return from a station's details to the list. */
  onClearSelection?: () => void;
  /** Fly the camera to a station. */
  onFocus?: (id: number) => void;
  pinnedIds?: number[];
  onTogglePin?: (id: number) => void;
  isEditMode: boolean;
  canEdit?: boolean;
  isDeleteMode: boolean;
  unplacedCount: number;
  onAdd: () => void;
  onToggleEdit: () => void;
  onToggleDelete: () => void;
  onSave: () => void;
}

/** Props for the TopBar header. */
export interface TopBarProps {
  rackCount: number;
  temperature: number | null;
  humidity: number | null;
  powerUsage: number | null;
  roomName?: string;
  locationString?: string;
  notifications: NotificationCounts;
  onPrev?: () => void;
  onNext?: () => void;
  onBack?: () => void;
}

/** Props for the RackStatus HTML overlay card. */
export interface RackStatusProps {
  name: string;
  temperature: number | null;
  humidity: number | null;
  powerUsage: number | null;
  status: RackStatus;
  pinned: boolean;
  onTogglePin: () => void;
}

/** Props for the floating action button group. */
export interface FabProps {
  isEditMode: boolean;
  isDeleteMode: boolean;
  unplacedCount: number;
  onAdd: () => void;
  onToggleEdit: () => void;
  onToggleDelete: () => void;
  onSave: () => void;
}
