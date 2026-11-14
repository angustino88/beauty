import { Alert, Button, Collapse, ConfigProvider, Descriptions, Image, Spin, Tabs, Tag } from 'antd';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button as UiButton } from '@/components/ui/button';
import { Pencil, Settings2 } from 'lucide-react';
import { AppstoreOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { useGetBenchMappingQuery, useGetEquipmentMappingQuery } from '@/features/spaces/mapping/api';
import { MappingVisualization } from '@/features/spaces/mapping/components/MappingVisualization';
import type { ResourceMappingRow } from '@/features/spaces/mapping/types';
import { SpaceDetailSummary } from '@/features/spaces/shared/components/SpaceDetailSummary';
import { EquipmentCompactSummary } from './EquipmentCompactSummary';
import { DowntimeTab } from '@/features/spaces/shared/components/DowntimeTab';
import { ChangeLifecycleModal } from '@/features/spaces/shared/components/ChangeLifecycleModal';
import type {
  LifecycleStatus,
  AccessPolicy,
} from '@/features/spaces/shared/resourceStatus';
import { LICENSE_STATUS_META } from '../status/LicenseStatus';
import styles from '../layout/EquipmentTable.module.css';
import { buildEquipmentInfo } from '../../utils/parity';
import { equipmentStatusValue } from '../../utils/equipmentStatus';
import EquipmentStatus from '../status/EquipmentStatus';
import { useGetEquipmentDetailQuery } from '../../../api/equipmentApi';
import presentation from './EquipmentDetailsModal.module.css';

type EquipmentRecord = Record<string, unknown> & { id: number | string };

interface EquipmentDetailsModalProps {
  open: boolean;
  equipmentType: string;
  record: EquipmentRecord | null;
  detailValueLabels?: Record<string, Record<string, string>>;
  onClose: () => void;
  onEdit?: () => void;
}

const NAME_FIELDS = [
  'name', 'lab_name', 'computer_name', 'accessory_name', 'monitor_name',
  'network_interface_name', 'powersupply_name', 'debug_hardware_name',
  'rack_name', 'room_name', 'license_name', 'sample_name',
];

type SummaryGroup = { title: string; fields: string[] };

const SUMMARY_GROUPS_BY_TYPE: Record<string, SummaryGroup[]> = {
  computer: [
    { title: 'Computer configuration', fields: ['computer_class', 'computer_manufacturer', 'computer_model', 'serial_number', 'computer_ip', 'os_name', 'replacement_date', 'acquisition_price', 'warranty_until'] },
    { title: 'Connected software and monitoring', fields: ['license_skus', 'license_names', 'disk_usage', 'sys_info', 'monitoring'] },
    { title: 'Record details', fields: ['log_label', 'remark', 'details'] },  
  ],
  monitor: [
    { title: 'Display specifications', fields: ['monitor_type', 'monitor_manufacturer', 'monitor_model', 'monitor_size', 'serial_number', 'acquisition_price', 'replacement_date', 'warranty_until'] },
    { title: 'License assignment', fields: ['license_skus', 'license_names'] },
    { title: 'Record details', fields: ['log_label', 'remark', 'details'] },  
  ],
  accessory: [
    { title: 'Accessory specifications', fields: ['accessory_type', 'accessory_manufacturer', 'accessory_model', 'serial_number', 'acquisition_price'] },  
    { title: 'License assignment', fields: ['license_skus', 'license_names'] },
    { title: 'Record details', fields: ['log_label', 'remark', 'details'] },  
  ],
  networkinterface: [
    { title: 'Network interface configuration', fields: ['network_protocol', 'network_interface_manufacturer', 'network_interface_model', 'serial_number', 'acquisition_price', 'warranty_until'] },
    { title: 'License assignment', fields: ['license_skus', 'license_names'] },
    { title: 'Record details', fields: ['log_label', 'remark', 'details'] },  
  ],
  powersupply: [
    { title: 'Power supply specifications', fields: ['powersupply_type', 'powersupply_manufacturer', 'powersupply_model', 'serial_number', 'acquisition_price', 'warranty_until'] },
    { title: 'License assignment', fields: ['license_skus', 'license_names'] },
    { title: 'Record details', fields: ['log_label', 'remark', 'details'] },  
  ],
  debughardware: [
    { title: 'Debug hardware specifications', fields: ['debug_hardware_type', 'debug_hardware_manufacturer', 'debug_hardware_model', 'serial_number', 'acquisition_price', 'warranty_until'] },
    { title: 'License assignment', fields: ['license_skus', 'license_names'] },
    { title: 'Record details', fields: ['log_label', 'remark', 'details'] },  
  ],
  sample: [
    { title: 'Sample characteristics', fields: ['sample_type', 'manufacturer', 'product_line', 'version', 'oem', 'kl', 'serial_number', 'communication_channel', 'sample_characteristic', 'acquisition_price'] },
    { title: 'License assignment', fields: ['license_skus', 'license_names'] },
    { title: 'Record details', fields: ['log_label', 'remark', 'details'] },  
  ],
  license: [
    { title: 'License entitlement', fields: ['license_product', 'license_vendor', 'license_type', 'license_category', 'license_restriction', 'license_seats', 'maximum_version', 'license_ID', 'expiry_date', 'acquisition_price'] },
    { title: 'License assignment', fields: ['serial_number', 'carrier_device'] },
    { title: 'Record details', fields: ['log_label', 'remark', 'details'] },  
  ],
  room: [
    { title: 'Room location', fields: ['location', 'location_info', 'country', 'city', 'building', 'floor'] },
    { title: 'Capacity and layout', fields: ['rows', 'cols', 'size', 'length', 'width', 'setup_capacity', 'rack_list', 'slot_summary'] },
    { title: 'Operating conditions', fields: ['temperature', 'humidity', 'max_power', 'power_usage'] },
    { title: 'Record details', fields: ['label', 'remark'] },      
  ],
  station: [
    { title: 'Room and placement', fields: ['room', 'slot_code', 'location_string'] },
    { title: 'Bench occupancy', fields: ['active_bench_count', 'bench_capacity'] },
    { title: 'Power and connections', fields: ['power_capacity_w', 'allocated_power_w', 'available_power_w', 'power_reserved_w', 'network_port_count'] },
    { title: 'Dimensions and load', fields: ['height_mm', 'width_mm', 'depth_mm', 'max_load_kg'] },
    { title: 'Record details', fields: ['label', 'remark'] },
  ],
  bench: [
    { title: 'Placement', fields: ['room', 'station', 'location_name', 'station_slot_id'] },
    { title: 'Bench configuration', fields: ['bench_group', 'bench_type', 'equipment_count', 'is_favorite'] },
    { title: 'Record details', fields: ['primary_owner', 'remark'] },
  ],
  lab: [
    { title: 'Lab identity', fields: ['lab_name', 'lab_group', 'technical_user', 'primary_owner'] },
    { title: 'Location and station', fields: ['location_name', 'location_string', 'location_url', 'rack', 'unit'] },
    { title: 'Equipment and activity', fields: ['lab_equipment', 'computer', 'current_activity', 'booking_status'] },
    { title: 'Audit and record details', fields: ['lab_audit', 'remark'] },
  ],
  rack: [
    { title: 'Station placement and capacity', fields: ['room', 'slot_code', 'location_string', 'current_capacity', 'setup_capacity', 'lab_equipment_list'] },
    { title: 'Station specifications', fields: ['rack_manufacturer', 'rack_model', 'height', 'width', 'depth', 'weight', 'max_total_load', 'max_power'] },
    { title: 'Record details', fields: ['label', 'remark'] },      
  ],
  };

  const DEFAULT_SUMMARY_GROUPS: SummaryGroup[] = [
    { title: 'Asset details', fields: ['kind', 'type', 'manufacturer', 'product_model', 'serial_number', 'acquisition_price', 'replacement_date', 'warranty_until', 'log_label', 'storage_room', 'department', 'owner', 'details', 'remark'] },
    { title: 'License assignment', fields: ['license_skus', 'license_names'] },
  ];

const SUMMARY_TYPE_ALIASES: Record<string, string> = {
  lab_info: 'lab',
  labinfo: 'lab',
  'lab-info': 'lab',
  debug_hardware: 'debughardware',
  network_interface: 'networkinterface',
  power_supply: 'powersupply',
  computing: 'computer',
  display: 'monitor',
  debugging: 'debughardware',
  networking: 'networkinterface',
  power: 'powersupply',
};

const FIELD_LABELS: Record<string, string> = {
  sku: 'SKU',
  ip_address: 'IP Address',
  mac_address: 'MAC Address',
  os_name: 'Operating System',
  rdp_file: 'RDP File',
  system_info: 'System information',
  monitored_devices: 'Monitored devices',
  monitoring: 'Monitored devices',
  lab_equipment_list: 'Assigned labs',
  current_capacity: 'Capacity used',
  setup_capacity: 'Capacity total',
  location_string: 'Location',
  location_info: 'Location details',
  sys_info: 'System information',
  lab_audit: 'Last audited',
  license_skus: 'License SKUs',
  license_names: 'License names',
  license_product: 'Product',
  license_vendor: 'Vendor',
  license_seats: 'License seats',
  license_ID: 'License ID',
  carrier_device: 'Carrier device',
  rack_list: 'Stations',
  slot_summary: 'Slot occupancy',
  active_bench_count: 'Active benches',
  bench_capacity: 'Bench capacity',
  available_power_w: 'Power remaining (W)',
  allocated_power_w: 'Allocated power (W)',
  power_capacity_w: 'Power capacity (W)',
  power_reserved_w: 'Reserved power (W)',
  network_port_count: 'Network ports',
  station_slot_id: 'Station slot ID',
  equipment_count: 'Assigned equipment',
  bench_group: 'Bench group',
  bench_type: 'Bench type',
  max_power: 'Maximum power',
  power_usage: 'Power usage',
  rack_manufacturer: 'Manufacturer',
  rack_model: 'Model',
  powersupply_type: 'Power supply type',
  powersupply_manufacturer: 'Power supply manufacturer',
  powersupply_model: 'Power supply model',
  network_protocol: 'Protocol',
  network_interface_manufacturer: 'Manufacturer',
  network_interface_model: 'Model',
  lab_group: 'Lab group',
  primary_owner: 'Primary owner',
  computer_class: 'Computer class',
  computer_manufacturer: 'Manufacturer',
  computer_model: 'Model',
  monitor_type: 'Monitor type',
  monitor_manufacturer: 'Manufacturer',
  monitor_model: 'Model',
  accessory_type: 'Accessory type',
  accessory_manufacturer: 'Manufacturer',
  accessory_model: 'Model',
  debug_hardware_type: 'Debug hardware type',
  debug_hardware_manufacturer: 'Manufacturer',
  debug_hardware_model: 'Model',
  sample_type: 'Sample type',
  manufacturer: 'Manufacturer',
  product_line: 'Product line',
  product_model: 'Model',
  communication_channel: 'Communication channel',
  sample_characteristic: 'Sample characteristic',
  replacement_date: 'Replacement date',
  warranty_until: 'Warranty until',
  acquisition_price: 'Acquisition price',
  price: 'Price',
  disk_usage: 'Disk usage',
  expiry_date: 'Expiry date',
  maximum_version: 'Maximum version',
  license_type: 'License type',
  license_category: 'Category',
  license_restriction: 'Restriction',
  current_status: 'Current status',
};

const humanize = (key: string) => key
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const firstText = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
};

const objectLabel = (value: Record<string, unknown>) => {
  const preferred = [
    'name', 'display_name', 'username', 'label', 'sku', 'class_name', 'classname',
    'manufacturer_name', 'model_name', 'modelname', 'type_name', 'room_name',
    'accessory_type_name', 'accessory_manufacturer_name', 'accessory_model_name',
    'debug_hardware_type_name', 'debug_hardware_manufacturer_name', 'debug_hardware_model_name',
    'powersupply_type_name', 'powersupply_manufacturer_name', 'powersupply_model_name',
    'protocol_name', 'network_protocol_name', 'network_interface_manufacturer_name',
    'network_interface_model_name', 'monitor_type_name', 'product_name', 'vendor_name',
    'category_name', 'restriction_name', 'license_type_name', 'license_category_name',
    'license_restriction_name', 'carrier_device_name',
    'sample_type_name', 'sample_manufacturer_name', 'sample_product_line_name',
    'sample_version_name', 'sample_OEM_name', 'sample_KL_name',
    'sample_communication_channel_name', 'sample_characteristic_name', 'size_name',
  ];
  const parts = preferred
    .map((key) => value[key])
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number');
  return [...new Set(parts.map(String))].join(' | ');
};

const isPopulated = (value: unknown) => value !== null && value !== undefined && value !== '';
const isInternalIdentifier = (key: string) => /^(id|uid)$|_(ids?|uid)$/i.test(key);

const readSummaryValue = (record: EquipmentRecord, key: string): unknown => {
  const fallbackFields: Record<string, string[]> = {
    lab_name: ['lab_equipment.lab_name'],
    lab: ['lab_equipment.lab', 'lab_equipment'],
    rack: ['lab_equipment.rack'],
    license_product: ['product'],
    license_vendor: ['vendor'],
    license_category: ['category'],
    license_restriction: ['restriction'],
    protocol: ['network_protocol'],
    manufacturer: ['network_interface_manufacturer'],
    model: ['network_interface_model'],
    network_protocol: ['protocol'],
    network_interface_manufacturer: ['manufacturer'],
    network_interface_model: ['model'],
  };
  if (key === 'lab_audit') {
    const audit = record.lab_audit as Record<string, unknown> | null | undefined;
    if (!audit?.audited_at || typeof audit.audited_at !== 'string') return undefined;
    const date = dayjs(audit.audited_at);
    const dateLabel = date.isValid() ? date.format('MMM D, YYYY') : audit.audited_at;
    const status = typeof audit.audit_status === 'string' && audit.audit_status
      ? ` (${audit.audit_status})`
      : '';
    return `${dateLabel}${status}`;
  }
  if (key === 'acquisition_price' || key === 'price') {
    const price = record.acquisition_price ?? record.price;
    if (price && typeof price === 'object' && 'amount' in price) {
      const p = price as { amount?: number | string; currency?: string };
      return `${p.currency ?? '$'}${Number(p.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (typeof price === 'number') {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return price;
  }
  if (key === 'replacement_date' && record.replacement_date) {
    const d = dayjs(String(record.replacement_date));
    return d.isValid() ? d.format('YYYY-[Q]Q') : String(record.replacement_date);
  }
  if (key === 'warranty_until' && record.warranty_until) {
    const d = dayjs(String(record.warranty_until));
    return d.isValid() ? d.format('YYYY-MM-DD') : String(record.warranty_until);
  }
  if (key === 'lab_group') {
    const group = record.lab_group;
    return group && typeof group === 'object' && !Array.isArray(group)
      ? (group as Record<string, unknown>).lab_group_name
      : group;
  }
  if (key === 'technical_user') {
    const user = record.technical_user;
    if (!user || typeof user !== 'object' || Array.isArray(user)) return user;
    const userRecord = user as Record<string, unknown>;
    return userRecord.display_name
      ?? userRecord.username
      ?? [userRecord.first_name, userRecord.last_name].filter(isPopulated).join(' ')
      ?? userRecord.email;
  }
  if (key === 'computer') {
    const computer = record.computer;
    if (!computer || typeof computer !== 'object' || Array.isArray(computer)) return computer;
    const computerRecord = computer as Record<string, unknown>;
    return [
      computerRecord.computer_name,
      computerRecord.computer_ip ? `IP: ${computerRecord.computer_ip}` : undefined,
      computerRecord.status ? `Status: ${humanize(String(computerRecord.status))}` : undefined,
    ].filter(isPopulated).join(' | ');
  }
  if (key === 'lab_equipment') {
    const equipment = record.lab_equipment;
    if (!equipment || typeof equipment !== 'object' || Array.isArray(equipment)) return equipment;
    const equipmentRecord = equipment as Record<string, unknown>;
    const lab = equipmentRecord.lab;
    const computer = equipmentRecord.computer;
    const rack = equipmentRecord.rack;
    const labName = lab && typeof lab === 'object' && !Array.isArray(lab)
      ? (lab as Record<string, unknown>).lab_name
      : undefined;
    const computerName = computer && typeof computer === 'object' && !Array.isArray(computer)
      ? (computer as Record<string, unknown>).computer_name
      : undefined;
    const rackName = rack && typeof rack === 'object' && !Array.isArray(rack)
      ? (rack as Record<string, unknown>).name ?? (rack as Record<string, unknown>).sku
      : undefined;
    return [
      labName,
      computerName ? `Computer: ${computerName}` : undefined,
      rackName ? `Station: ${rackName}` : undefined,
    ].filter(isPopulated).join(' | ');
  }
  if (key === 'current_activity') {
    const activity = record.current_activity;
    if (!activity || typeof activity !== 'object' || Array.isArray(activity)) return activity;
    const activityRecord = activity as Record<string, unknown>;
    const created = typeof activityRecord.created === 'string' ? dayjs(activityRecord.created) : null;
    return [
      activityRecord.status ? `Status: ${humanize(String(activityRecord.status))}` : undefined,
      activityRecord.booking_code ? `Booking: ${activityRecord.booking_code}` : undefined,
      activityRecord.source ? `Source: ${activityRecord.source}` : undefined,
      created?.isValid() ? `Created: ${created.format('MMM D, YYYY HH:mm')}` : undefined,
    ].filter(isPopulated).join(' | ');
  }
  if (key === 'booking_status') {
    const booking = record.booking_status;
    if (!booking || typeof booking !== 'object' || Array.isArray(booking)) return booking;
    const bookingRecord = booking as Record<string, unknown>;
    const bookingInfo = bookingRecord.booking_info;
    const bookingCode = bookingInfo && typeof bookingInfo === 'object' && !Array.isArray(bookingInfo)
      ? (bookingInfo as Record<string, unknown>).booking_code
      : undefined;
    return [
      bookingRecord.is_booked ? 'Booked' : 'Not booked',
      bookingCode ? `Booking: ${bookingCode}` : undefined,
    ].filter(isPopulated).join(' | ');
  }
  if (key === 'license_skus') {
    return Array.isArray(record.licenses)
      ? record.licenses
        .map((license) => typeof license === 'object' && license !== null
          ? (license as Record<string, unknown>).sku
          : undefined)
        .filter(isPopulated)
      : undefined;
  }
  if (key === 'license_names') {
    return Array.isArray(record.licenses)
      ? record.licenses
        .map((license) => typeof license === 'object' && license !== null
          ? ((license as Record<string, unknown>).name ?? (license as Record<string, unknown>).license_name)
          : undefined)
        .filter(isPopulated)
      : undefined;
  }
  const nestedValue = (path: string) => path.split('.').reduce<unknown>((value, part) => (
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)[part]
      : undefined
  ), record);
  return record[key] ?? fallbackFields[key]
    ?.map((field) => nestedValue(field))
    .find(isPopulated);
};

const renderDiskUsage = (value: unknown) => {
  if (!Array.isArray(value) || value.length === 0) {
    return <span className={styles.emptyValue}>Not specified</span>;
  }

  const drives = value
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => {
      const name = typeof entry.name === 'string' && entry.name ? entry.name : 'Drive';
      const used = Number(entry.used ?? 0);
      const total = Number(entry.total ?? 0);
      if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return name;

      const free = Math.max(total - used, 0);
      const utilization = Math.round((used / total) * 100);
      return `${name} - ${free} GB free of ${total} GB (${utilization}% used)`;
    })
    .filter(Boolean);

  return drives.length > 0 ? drives.join(', ') : <span className={styles.emptyValue}>Not specified</span>;
};

const renderLabeledEntries = (entries: Array<{ label: string; value: unknown }>) => {
  const populatedEntries = entries.filter(({ value }) => isPopulated(value));
  if (populatedEntries.length === 0) return <span className={styles.emptyValue}>Not specified</span>;

  return (
    <div>
      {populatedEntries.map(({ label, value }, index) => (
        <div key={`${label}-${index}`}>
          <strong>{label}:</strong> {String(value)}
        </div>
      ))}
    </div>
  );
};

const renderSystemInformation = (value: unknown) => {
  const entries = Array.isArray(value)
    ? value
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({ label: String(item.item ?? ''), value: item.value }))
    : value && typeof value === 'object' && !Array.isArray(value)
      ? Object.entries(value as Record<string, unknown>).map(([label, entryValue]) => ({ label, value: entryValue }))
      : [];

  return renderLabeledEntries(entries);
};

const renderAssignedLabs = (value: unknown) => {
  if (!Array.isArray(value)) return renderValue(value);

  const entries = value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const lab = item as Record<string, unknown>;
    return [
      { label: 'Lab Name', value: lab.lab_name ?? lab.name },
    ];
  });

  return renderLabeledEntries(entries);
};

const decodeReferenceValues = (value: unknown, labels?: Record<string, string>): unknown => {
  if (!labels) return value;
  if (typeof value === 'number' || typeof value === 'string') {
    return labels[String(value)] ?? value;
  }
  if (!Array.isArray(value)) return value;
  const decoded = value
    .map((item) => {
      if (typeof item === 'number' || typeof item === 'string') return labels[String(item)];
      if (typeof item === 'object' && item !== null) {
        const record = item as Record<string, unknown>;
        const label = objectLabel(record);
        if (label) return label;
        return labels[String(record.id ?? record.value ?? '')];
      }
      return undefined;
    })
    .filter(isPopulated);
  return decoded.length > 0 ? decoded : undefined;
};

const renderValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return <span className={styles.emptyValue}>Not specified</span>;
  }
  if (typeof value === 'boolean') {
    return <Tag color={value ? 'green' : 'default'}>{value ? 'Yes' : 'No'}</Tag>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className={styles.emptyValue}>None</span>;
    return <div className={presentation.valueList}>{value.map((item, index) => <div key={index}>{renderValue(item)}</div>)}</div>;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const entries = Object.entries(record).filter(([key, item]) => !isInternalIdentifier(key) && isPopulated(item));
    if (entries.length === 0) return <span className={styles.emptyValue}>Not specified</span>;
    // Reference objects such as category/kind often contain only an ID and name.
    // The outer field already provides context; avoid "Category → Name → Computing".
    if (entries.length === 1 && ['name', 'display_name', 'label'].includes(entries[0][0])) {
      return renderValue(entries[0][1]);
    }
    return <dl className={presentation.nestedValues}>{entries.map(([key, item]) => <div key={key}><dt>{humanize(key)}</dt><dd>{renderValue(item)}</dd></div>)}</dl>;
  }
  return String(value);
};

const renderInformation = (value: string) => {
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return <span className={styles.emptyValue}>Not specified</span>;

  return (
    <ul className={presentation.informationList}>
      {lines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
    </ul>
  );
};

export default function EquipmentDetailsModal({
  open,
  equipmentType,
  record: selectedRecord,
  detailValueLabels,
  onClose,
  onEdit,
}: EquipmentDetailsModalProps) {
  const [mappingExpanded, setMappingExpanded] = useState(true);
  const [lifecycleModalOpen, setLifecycleModalOpen] = useState(false);
  const { permissionGroups } = useAuthState();
  const isAdmin = Boolean(
    permissionGroups && (permissionGroups['admin'] || permissionGroups['lab-coordinator']),
  );

  const isEquipment = ['computing', 'display', 'debugging', 'networking', 'power', 'accessory', 'sample', 'furniture', 'instrument', 'laboratory', 'mechanical', 'other'].includes(equipmentType);
  const selectedId = Number(selectedRecord?.id);
  const detailQuery = useGetEquipmentDetailQuery({ category: equipmentType, id: selectedId }, { skip: !open || !isEquipment || !Number.isFinite(selectedId) });
  const record = selectedRecord ? { ...selectedRecord, ...(isEquipment ? detailQuery.currentData : undefined) } : null;
  const summaryType = SUMMARY_TYPE_ALIASES[equipmentType] ?? equipmentType;
  const recordId = record ? Number(record.id) : NaN;

  const normalizedSpaceType: 'room' | 'station' | 'bench' | null =
    summaryType === 'room'
      ? 'room'
      : summaryType === 'station' || summaryType === 'rack'
        ? 'station'
        : summaryType === 'bench' || summaryType === 'lab_info' || summaryType === 'lab'
          ? 'bench'
          : null;

  const currentLifecycle: LifecycleStatus | undefined =
    typeof record?.lifecycle_status === 'object' && record?.lifecycle_status !== null
      ? ((record.lifecycle_status as { value?: LifecycleStatus }).value)
      : typeof record?.lifecycle_status === 'string'
        ? (record.lifecycle_status as LifecycleStatus)
        : undefined;

  const currentAccessPolicy: AccessPolicy | undefined =
    typeof record?.access_policy === 'object' && record?.access_policy !== null
      ? ((record.access_policy as { value?: AccessPolicy }).value)
      : typeof record?.access_policy === 'string'
        ? (record.access_policy as AccessPolicy)
        : undefined;

  const carrierValue = summaryType === 'license' ? record?.carrier_device : undefined;
  const carrierDevice = typeof carrierValue === 'object' && carrierValue !== null && !Array.isArray(carrierValue)
    ? carrierValue as Record<string, unknown>
    : null;
  const carrierId = Number(carrierDevice?.id);
  const mappingQuery = useGetBenchMappingQuery(recordId, {
    skip: !open || isEquipment || !Number.isFinite(recordId),
  });
  const equipmentMappingQuery = useGetEquipmentMappingQuery(recordId, { skip: !open || !isEquipment || !Number.isFinite(recordId) });

  const connectedMappingRows = useMemo(() => {
    const allRows = isEquipment
      ? equipmentMappingQuery.currentData ?? []
      : mappingQuery.currentData ? [mappingQuery.currentData] : [];
    if (!open || !Number.isFinite(recordId)) return [];

    if (summaryType === 'license') {
      if (!carrierId) return [];
      return allRows.filter((r: ResourceMappingRow) => r.equipment.some((e) => e.id === carrierId));
    }
    if (summaryType === 'bench' || summaryType === 'lab_info') {
      return allRows.filter((r: ResourceMappingRow) => r.bench.id === recordId);
    }
    return allRows.filter((r: ResourceMappingRow) => r.equipment.some((e) => e.id === recordId));
  }, [mappingQuery.currentData, equipmentMappingQuery.currentData, isEquipment, open, recordId, summaryType, carrierId]);

  if (!record) return null;

  const displayType = humanize(equipmentType);
  const name = firstText(record, NAME_FIELDS) ?? `${displayType} equipment`;
  const sku = firstText(record, ['sku', 'asset_tag', 'serial_number']);
  const image = typeof record.image === 'string' && record.image ? record.image : undefined;
  const status = record.current_status as Record<string, unknown> | null | undefined;
  const displayStatus = record.display_status ?? record.status ?? status?.status_type;
  const statusType = equipmentStatusValue(displayStatus);
  const statusMeta = LICENSE_STATUS_META[statusType.trim().toLowerCase()];
  const overviewItems = [
    ['Primary owner', readSummaryValue(record, 'primary_owner') ?? record.owner],
    ['Last audited', readSummaryValue(record, 'lab_audit')],
  ] as Array<readonly [string, unknown]>;
  const summaryGroups = (SUMMARY_GROUPS_BY_TYPE[summaryType] ?? DEFAULT_SUMMARY_GROUPS)
    .map(({ title, fields }) => ({
      title,
      items: fields
        .filter((key) => !isInternalIdentifier(key))
        .map((key) => [key, readSummaryValue(record, key)] as const)
        .map(([key, value]) => [FIELD_LABELS[key] ?? humanize(key), value] as const),
    }))
    .map((group) => ({
      ...group,
      items: group.items.filter(([, value]) => isPopulated(value)),
    }))
    .filter((group) => group.items.length > 0);
  const informationParts = [
    buildEquipmentInfo(record),
    ...connectedMappingRows.flatMap((row) => {
      const benchName = row.bench.name || row.bench.sku || 'Unnamed bench';
      const location = row.room?.name ? ` [Room: ${row.room.name}]` : '';
      return [`Bench: ${benchName}${location}`];
    }),
  ].filter(Boolean);
  const information = [...new Set(informationParts)].join('\n');
  const canonicalItems = ['kind', 'type', 'manufacturer', 'product_model', 'department', 'storage_room', 'serial_number']
    .filter((key) => isPopulated(record[key]))
    .map((key) => [humanize(key), record[key]] as const);
  if (canonicalItems.length) summaryGroups.unshift({ title: 'Equipment details', items: canonicalItems });
  let allGroups = information
    ? [{ title: 'Information', items: [['Information', information] as const] }, ...summaryGroups]
    : summaryGroups;
  if (isEquipment) {
    const groups: SummaryGroup[] = [
      { title: 'Identification & classification', fields: ['sku', 'category', 'kind', 'type', 'manufacturer', 'product_model', 'serial_number', 'log_label'] },
      { title: 'Ownership & location', fields: ['owner', 'department', 'group', 'storage_room', 'technical_user'] },
      { title: 'Lifecycle & acquisition', fields: ['status', 'acquisition_price', 'warranty_until', 'replacement_date'] },
      { title: 'Licenses & audit', fields: ['licenses', 'lab_audit'] },
      { title: 'Computing & telemetry', fields: ['hostname', 'ip_address', 'mac_address', 'os_name', 'rdp_file', 'disk_usage', 'system_info', 'sys_info', 'monitored_devices', 'monitoring', 'activity'] },
      { title: 'Notes & record history', fields: ['information', 'details', 'remark', 'created_at', 'updated_at'] },
    ];
    const usedKeys = new Set(groups.flatMap((group) => group.fields));
    usedKeys.add('name');
    usedKeys.add('image');
    const remainingKeys = Object.keys(record).filter((key) => !usedKeys.has(key) && !isInternalIdentifier(key));
    if (remainingKeys.length) groups.splice(groups.length - 1, 0, { title: 'Additional specifications', fields: remainingKeys });
    allGroups = groups.map((group) => ({ title: group.title, items: group.fields
      .filter((key) => key in record)
      .map((key) => [FIELD_LABELS[key] ?? humanize(key), ['acquisition_price', 'replacement_date', 'warranty_until'].includes(key) ? readSummaryValue(record, key) : record[key]] as const)
    })).filter((group) => group.items.length > 0);
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent className={presentation.sheet}>
        <header className="tw:shrink-0 tw:border-0 tw:border-b tw:border-solid tw:border-border tw:px-6 tw:py-5 tw:pr-16">
          <SheetTitle className="tw:m-0 tw:text-base tw:font-semibold">{isEquipment ? 'Equipment details' : `${displayType} summary`}</SheetTitle>
          <SheetDescription className="tw:mt-1 tw:text-xs tw:text-muted-foreground">{name}{sku && name !== sku ? ` · ${sku}` : ''}</SheetDescription>
          <div className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-2">
          {isAdmin && normalizedSpaceType && (
            <UiButton variant="outline" size="sm" onClick={() => setLifecycleModalOpen(true)}><Settings2 />Change lifecycle</UiButton>
          )}
          {onEdit && (
            <UiButton size="sm" onClick={onEdit}><Pencil />Edit {displayType}</UiButton>
          )}
          </div>
        </header>
        <ConfigProvider getPopupContainer={(trigger) => trigger?.parentElement ?? document.body}>
        <div className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:bg-background tw:p-6">
      {!normalizedSpaceType && !isEquipment && (
        <div className={styles.detailsHero}>
          {statusType && (
            <Tag
              className={styles.detailsStatus}
              style={{ backgroundColor: statusMeta?.bgColor ?? '#344054', borderColor: statusMeta?.bgColor ?? '#344054' }}
            >
              <span className={styles.statusIndicator} aria-hidden="true" />
              {statusMeta?.label ?? humanize(statusType)}
            </Tag>
          )}
          <div className={styles.equipmentImage}>
            {image ? (
              <Image src={image} alt={name} preview={{ mask: 'View image' }} />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className={styles.detailsIdentity}>
            <span className={styles.detailsEyebrow}>{displayType} asset</span>
            <h2>{name}</h2>
            {sku && <div className={styles.identifierLine}>
              <span className={styles.detailsSku}>{sku}</span>
            </div>}
          </div>
        </div>
      )}

      {!isEquipment && !normalizedSpaceType && overviewItems.length > 0 && (
        <div className={styles.overviewStrip}>
          {overviewItems.map(([label, value]) => (
            <div className={styles.overviewItem} key={label}>
              <span>{label}</span>
              <strong>{renderValue(value)}</strong>
            </div>
          ))}
        </div>
      )}

      <div className={styles.detailsBody}>
        {normalizedSpaceType ? (
          <Tabs
            defaultActiveKey="overview"
            items={[
              {
                key: 'overview',
                label: 'Overview',
                children: (
                  <SpaceDetailSummary
                    spaceKind={normalizedSpaceType}
                    record={record}
                    connectedRows={connectedMappingRows}
                  />
                ),
              },
              {
                key: 'downtime',
                label: 'Downtime',
                children: (
                  <DowntimeTab
                    resourceType={normalizedSpaceType}
                    resourceId={recordId}
                    resourceName={name}
                    isAdminOrCoordinator={isAdmin}
                  />
                ),
              },
            ]}
          />
        ) : isEquipment ? (
          <>
            {detailQuery.isFetching && (
              <div className={presentation.feedback}>
                <Spin size="small" /> Loading full equipment details
              </div>
            )}
            {detailQuery.isError && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message="Full details could not be loaded. Showing table record."
                action={
                  <Button size="small" onClick={() => detailQuery.refetch()}>
                    Retry
                  </Button>
                }
              />
            )}
            <EquipmentCompactSummary
              equipmentType={equipmentType}
              record={record}
              connectedRows={connectedMappingRows}
              displayStatus={displayStatus}
            />
          </>
        ) : (
          <>
            {isEquipment && detailQuery.isFetching && <div className={presentation.feedback}><Spin size="small" /> Loading full equipment details</div>}
            {isEquipment && detailQuery.isError && <Alert type="warning" showIcon title="Full details could not be loaded. Showing the table record." action={<Button size="small" onClick={() => detailQuery.refetch()}>Retry</Button>} />}
            {isEquipment && <section className={styles.detailsSection}>
                    <div className={styles.sectionHeading}>
                <div className={presentation.sectionTitle}><AppstoreOutlined /><h3>Equipment relationships</h3></div>
                <span>{connectedMappingRows.length} {connectedMappingRows.length === 1 ? 'assignment' : 'assignments'}</span>
              </div>
              {equipmentMappingQuery.isFetching ? <div className={presentation.feedback}><Spin size="small" /> Loading mapping</div> : equipmentMappingQuery.isError ?
                <Alert type="warning" title="Equipment mapping could not be loaded" action={<Button size="small" onClick={() => equipmentMappingQuery.refetch()}>Retry</Button>} /> : connectedMappingRows.length === 0 ?
                <div className={presentation.emptyMapping}>No bench assignment for this equipment.</div> : (
                  <div className={presentation.connectedGraph} role="region" aria-label="Connected equipment relationship graph">
                    <p className={presentation.graphHint}>Room → Station / Bench → Equipment → Licenses. The selected equipment is highlighted.</p>
                    <MappingVisualization
                      rows={connectedMappingRows}
                      loading={false}
                      showPagination={false}
                      compact
                      selectedDeviceType={equipmentType}
                      selectedDeviceId={recordId}
                    />
                  </div>
                )}
            </section>}
            {!isEquipment && connectedMappingRows.length > 0 ? (
              <section className={styles.detailsSection}>
                <Collapse
                  className={styles.mappingCollapse}
                  activeKey={mappingExpanded ? ['mapping'] : []}
                  onChange={(keys) => setMappingExpanded(keys.includes('mapping'))}
                  items={[{
                    key: 'mapping',
                    label: 'Connected equipment',
                    children: (
                      <MappingVisualization
                        rows={connectedMappingRows}
                        loading={mappingQuery.isLoading || mappingQuery.isFetching}
                        page={1}
                        pageSize={1}
                        total={connectedMappingRows.length}
                        onPageChange={() => undefined}
                        showPagination={false}
                        compact
                        selectedDeviceId={recordId}
                      />
                    ),
                  }]}
                />
              </section>
            ) : null}
            {allGroups.map((group) => (
              <section className={`${styles.detailsSection} ${presentation.detailSection}`} key={group.title}>
                <div className={styles.sectionHeading}>
                  <div className={presentation.sectionTitle}><InfoCircleOutlined /><h3>{group.title}</h3></div>
                </div>
                <Descriptions className={presentation.detailsDescriptions} column={{ xs: 1, sm: 2 }} size="small" bordered>
                  {group.items.map(([label, value]) => <Descriptions.Item label={label} key={label}>
                    {label === 'Information'
                      ? renderInformation(String(value ?? ''))
                      : label === 'Status'
                        ? <EquipmentStatus status={displayStatus} />
                        : label === 'Disk Usage' || label === 'Disk usage'
                          ? renderDiskUsage(value)
                          : label === 'System information' || label === 'System Info'
                            ? renderSystemInformation(value)
                            : label === 'Assigned labs'
                              ? renderAssignedLabs(value)
                              : renderValue(decodeReferenceValues(value, detailValueLabels?.[label]))}
                  </Descriptions.Item>)}
                </Descriptions>
              </section>
            ))}
          </>
        )}
      </div>

        </div>
        </ConfigProvider>
      {normalizedSpaceType && (
        <ChangeLifecycleModal
          open={lifecycleModalOpen}
          resourceType={normalizedSpaceType}
          resourceId={recordId}
          resourceName={name}
          currentLifecycle={currentLifecycle}
          currentAccessPolicy={currentAccessPolicy}
          onClose={() => setLifecycleModalOpen(false)}
        />
      )}
      </SheetContent>
    </Sheet>
  );
}