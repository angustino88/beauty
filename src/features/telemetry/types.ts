/** Wire types of `/api/labs/telemetry/*` (backend: core/labs/features/telemetry/api/serializers.py). */

export type TargetType = 'room' | 'station' | 'bench' | 'equipment';

export interface Choice<T extends string = string> {
  value: T;
  label: string;
}

export interface NamedRef {
  id: number;
  name: string;
}

export interface TargetRef extends NamedRef {
  type: TargetType;
}

export interface ModbusSettings {
  network_host: string;
  port: number;
  framing: Choice<'mbap' | 'rtu_over_tcp'>;
  serial_interface: Choice<'rs485' | 'rs232'> | null;
  baud_rate: number | null;
  parity: Choice<'N' | 'E' | 'O'> | null;
  data_bits: number | null;
  stop_bits: number | null;
  request_timeout_ms: number;
  has_shared_bus: boolean;
}

export interface Channel {
  id: number;
  label: string;
  source: NamedRef;
  metric: { id: string; name: string };
  unit: string;
  is_enabled: boolean;
  unit_id: number | null;
  profile: NamedRef | null;
  measures: { target: TargetRef; started_at: string } | null;
  field_device: NamedRef | null;
  created_at: string;
  updated_at: string;
}

export type DeviceRole = 'gateway' | 'source';
export type DeviceState = 'discovered' | 'claimed' | 'retired';
export type GatewayKind = 'room_host' | 'station_pc' | 'equipment_agent';
export type SourceKind = 'modbus_tcp';

export interface Device {
  id: number;
  role: Choice<DeviceRole>;
  kind: Choice<GatewayKind | SourceKind>;
  device_uid: string;
  state: Choice<DeviceState>;
  manufacturer: string;
  model: string;
  equipment: NamedRef | null;
  install_location: TargetRef | null;
  room: NamedRef | null;
  scope: TargetRef | null;
  modbus: ModbusSettings | null;
  channel_count: number;
  config_version: number;
  config_version_applied: number | null;
  reported_by: NamedRef | null;
  last_seen_address: string;
  first_seen_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceDetail extends Device {
  channels: Channel[];
}

export interface ModbusReadEntry {
  function_code: 3 | 4;
  register: number;
  words?: number;
  type: 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32';
  word_order?: 'big' | 'little';
  scale?: number;
  offset?: number;
}

export interface DeviceProfile {
  id: number;
  key: string;
  version: number;
  reference: string;
  protocol: Choice<'modbus'>;
  manufacturer: string;
  model: string;
  status: Choice<'draft' | 'approved'>;
  read_map: Record<string, ModbusReadEntry>;
  comm_defaults: Record<string, unknown>;
  notes: string;
  approved_at: string | null;
  channel_count: number;
  created_by: NamedRef | null;
  updated_by: NamedRef | null;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  key: string;
  name: string;
  unit: string;
  value_min: string | null;
  value_max: string | null;
  kind: Choice;
  aggregation: Choice;
  combine: Choice;
  decimals: number;
}

export interface TargetOverview {
  target: TargetRef;
  installed_devices: Device[];
  channels: Channel[];
}

export interface Page<T> {
  data: T[];
  meta?: { pagination?: { count?: number; next?: number | string | null } };
}

// ---- requests ---------------------------------------------------------------------------------

export interface ModbusSettingsInput {
  network_host: string;
  port?: number;
  framing?: 'mbap' | 'rtu_over_tcp';
  serial_interface?: '' | 'rs485' | 'rs232';
  baud_rate?: number | null;
  parity?: '' | 'N' | 'E' | 'O';
  data_bits?: number | null;
  stop_bits?: number | null;
  request_timeout_ms?: number;
  has_shared_bus?: boolean;
}

export interface SourceCreateInput {
  kind: SourceKind;
  device_uid: string;
  equipment_id: number;
  install_location_type: TargetType;
  install_location_id: number;
  modbus: ModbusSettingsInput;
  manufacturer?: string;
  model?: string;
}

export interface ChannelsFromProfileInput {
  unit_id: number;
  profile_id: number;
  metrics?: string[];
  target_type?: TargetType;
  target_id?: number;
  label?: string;
  field_device_equipment_id?: number | null;
}

export interface DeviceListParams {
  role?: DeviceRole;
  state?: DeviceState;
  room_id?: number;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface ProfileCreateInput {
  key: string;
  protocol: 'modbus';
  manufacturer?: string;
  model?: string;
  read_map: Record<string, ModbusReadEntry>;
  comm_defaults?: Record<string, unknown>;
  notes?: string;
}
