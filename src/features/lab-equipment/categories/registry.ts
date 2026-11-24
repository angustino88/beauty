import React from 'react';
import type { EquipmentCategoryKey } from '../types/equipment';
import {
  LaptopOutlined,
  DesktopOutlined,
  BugOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  SkinOutlined,
  ToolOutlined,
  BuildOutlined,
  SettingOutlined,
  InboxOutlined,
} from '@ant-design/icons';

export interface CategoryExtraField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'date' | 'select' | 'multi-select';
  createOnly?: boolean;
  span?: number;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  referenceKey?: keyof import('../types/equipment').EquipmentReferenceData;
}

export interface CategoryExtraColumn {
  title: string;
  dataIndex: string;
  width?: number;
  render?: (val: unknown) => React.ReactNode;
}

export interface EquipmentCategoryConfig {
  key: EquipmentCategoryKey;
  label: string;
  singular: string;
  description: string;
  icon: React.ReactNode;
  extraFields?: CategoryExtraField[];
  extraColumns?: CategoryExtraColumn[];
  supportsTelemetry?: boolean;
  /** Units can run the LabMango agent: shows the Agent column, menu item and drawer. */
  supportsAgent?: boolean;
}

export const EQUIPMENT_CATEGORIES: Record<EquipmentCategoryKey, EquipmentCategoryConfig> = {
  computing: {
    key: 'computing',
    label: 'Computing',
    singular: 'Computing Device',
    description: 'Workstations, servers, mini PCs, and virtual instances',
    icon: React.createElement(LaptopOutlined),
    supportsTelemetry: true,
    supportsAgent: true,
    extraFields: [
      { name: 'hostname', label: 'Hostname', type: 'text', placeholder: 'lab-svr-01', createOnly: true },
      { name: 'mac_address', label: 'MAC Address', type: 'text', placeholder: '00:1A:2B:3C:4D:5E' },
    ],
    extraColumns: [
      { title: 'IP Address', dataIndex: 'ip_address', width: 140 },
      { title: 'Operating System', dataIndex: 'os_name', width: 150 },
    ],
  },
  display: {
    key: 'display',
    label: 'Display',
    singular: 'Display Monitor',
    description: 'Monitors, screens, projection units, and head-mounted displays',
    icon: React.createElement(DesktopOutlined),
    extraFields: [
      { name: 'size_id', label: 'Screen Size', type: 'select', referenceKey: 'sizes' },
      { name: 'resolution_id', label: 'Resolution', type: 'select', referenceKey: 'resolutions' },
      { name: 'interfaces_ids', span: 24, label: 'Interfaces', type: 'multi-select', referenceKey: 'interfaces' },
    ],
    extraColumns: [
      {
        title: 'Size', dataIndex: 'size', width: 110,
        render: (value) => typeof value === 'object' && value !== null ? String((value as Record<string, unknown>).size ?? '—') : String(value ?? '—'),
      },
      {
        title: 'Resolution', dataIndex: 'resolution', width: 130,
        render: (value) => typeof value === 'object' && value !== null ? String((value as Record<string, unknown>).resolution ?? '—') : String(value ?? '—'),
      },
      { title: 'Interfaces', dataIndex: 'interfaces', width: 150, render: (value) => Array.isArray(value) ? value.map((item) => typeof item === 'object' && item !== null ? String((item as Record<string, unknown>).name ?? '') : String(item)).filter(Boolean).join(', ') || '—' : '—' },
    ],
  },
  debugging: {
    key: 'debugging',
    label: 'Debugging',
    singular: 'Debug Hardware',
    description: 'JTAG adapters, in-circuit emulators, logic analyzers, and debug probes',
    icon: React.createElement(BugOutlined),
  },
  networking: {
    key: 'networking',
    label: 'Networking',
    singular: 'Network Device',
    description: 'Switches, routers, CAN/LIN adapters, Wi-Fi bridges, and interfaces',
    icon: React.createElement(ApiOutlined),
    extraFields: [
      { name: 'mac_address', label: 'MAC Address', type: 'text', placeholder: '00:1A:2B:3C:4D:5E' },
      { name: 'protocol_id', label: 'Protocol', type: 'select', referenceKey: 'protocols' },
    ],
    extraColumns: [
      { title: 'MAC Address', dataIndex: 'mac_address', width: 150 },
      { title: 'Protocol', dataIndex: 'protocol', width: 140, render: (value) => typeof value === 'object' && value !== null ? String((value as Record<string, unknown>).name ?? '—') : String(value ?? '—') },
    ],
  },
  power: {
    key: 'power',
    label: 'Power',
    singular: 'Power Supply',
    description: 'Programmable bench power supplies, loads, and battery simulators',
    icon: React.createElement(ThunderboltOutlined),
    extraFields: [
      { name: 'channels', label: 'Output Channels', type: 'number', placeholder: '1' },
      { name: 'power_rating', label: 'Power Rating (W)', type: 'number', placeholder: 'Power rating in watts' },
      { name: 'interfaces_ids', span: 24, label: 'Interfaces', type: 'multi-select', referenceKey: 'interfaces' },
    ],
  },
  accessory: {
    key: 'accessory',
    label: 'Accessories',
    singular: 'Accessory',
    description: 'Cables, breakout boards, adapters, mounting brackets, and dongles',
    icon: React.createElement(AppstoreOutlined),
  },
  sample: {
    key: 'sample',
    label: 'Samples',
    singular: 'Sample / Prototype',
    description: 'Customer evaluation units, pre-series prototypes, and testing samples',
    icon: React.createElement(ExperimentOutlined),
    extraFields: [
      { name: 'customer_id', label: 'Customer', type: 'select', referenceKey: 'customers' },
      { name: 'characteristics_ids', label: 'Characteristics', type: 'multi-select', referenceKey: 'characteristics' },
      { name: 'interfaces_ids', span: 24, label: 'Interfaces', type: 'multi-select', referenceKey: 'interfaces' },
    ],
    extraColumns: [
      { title: 'Customer', dataIndex: 'customer', width: 140 },
      { title: 'Characteristics', dataIndex: 'characteristics', width: 180, render: (value) => Array.isArray(value) ? value.map((item) => typeof item === 'object' && item !== null ? String((item as Record<string, unknown>).name ?? '') : String(item)).filter(Boolean).join(', ') || '—' : '—' },
    ],
  },
  furniture: {
    key: 'furniture',
    label: 'Furniture',
    singular: 'Furniture',
    description: 'Workbenches, ESD chairs, mobile carts, and storage cabinets',
    icon: React.createElement(SkinOutlined),
    extraFields: [
      { name: 'dimensions', label: 'Dimensions (JSON)', type: 'textarea', placeholder: '{"length_mm": 1200, "width_mm": 600, "height_mm": 750}' },
      { name: 'material_id', span: 24, label: 'Material', type: 'select', referenceKey: 'materials' },
    ],
    extraColumns: [
      { title: 'Dimensions', dataIndex: 'dimensions', width: 160 },
    ],
  },
  instrument: {
    key: 'instrument',
    label: 'Instruments',
    singular: 'Test Instrument',
    description: 'Oscilloscopes, multimeters, spectrum analyzers, and signal generators',
    icon: React.createElement(ToolOutlined),
    extraFields: [
      { name: 'interfaces_ids', span: 24, label: 'Interfaces', type: 'multi-select', referenceKey: 'interfaces' },
    ],
    extraColumns: [
      { title: 'Calibration Due', dataIndex: 'next_calibration_due_at', width: 170 },
      { title: 'Interfaces', dataIndex: 'interfaces', width: 150, render: (value) => Array.isArray(value) ? value.map((item) => typeof item === 'object' && item !== null ? String((item as Record<string, unknown>).name ?? '') : String(item)).filter(Boolean).join(', ') || '—' : '—' },
    ],
  },
  laboratory: {
    key: 'laboratory',
    label: 'Laboratory',
    singular: 'Laboratory Machine',
    description: 'Climate chambers, thermal cameras, soldering stations, and fume extractors',
    icon: React.createElement(BuildOutlined),
  },
  mechanical: {
    key: 'mechanical',
    label: 'Mechanical',
    singular: 'Mechanical Device',
    description: 'Fixtures, torque testers, automated test rigs, and chassis mounts',
    icon: React.createElement(SettingOutlined),
    extraFields: [
      { name: 'dimensions', label: 'Dimensions (JSON)', type: 'textarea', placeholder: '{"length_mm": 100, "width_mm": 50, "height_mm": 25}' },
      { name: 'material_id', span: 24, label: 'Material', type: 'select', referenceKey: 'materials' },
    ],
    extraColumns: [
      { title: 'Dimensions', dataIndex: 'dimensions', width: 160, render: (value) => typeof value === 'object' && value !== null ? Object.values(value as Record<string, unknown>).join(' × ') : String(value ?? '—') },
    ],
  },
  other: {
    key: 'other',
    label: 'Other',
    singular: 'Other Resource',
    description: 'Miscellaneous tools, safety gear, and unclassified equipment',
    icon: React.createElement(InboxOutlined),
  },
};
