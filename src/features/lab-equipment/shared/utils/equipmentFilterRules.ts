import type { EquipmentFilterRules } from '../api/equipmentFilterApi';

export const EQUIPMENT_FILTER_RULES: Record<string, EquipmentFilterRules> = {
  LabComputer: {
    single: ['status', 'sku', 'computer_name', 'computer_class', 'computer_manufacturer', 'computer_model', 'computer_ip', 'os_name', 'serial_number', 'labs_license_computer', 'primary_owner'],
    multiple: [],
  },
  Sample: {
    single: ['sku', 'name', 'manufacturer', 'product_line', 'version', 'sample_type', 'oem', 'kl', 'serial_number', 'communication_channel', 'log_label', 'labs_license_sample', 'primary_owner'],
    multiple: ['sample_characteristic'],
  },
  NetworkInterface: {
    single: ['sku', 'network_interface_name', 'serial_number', 'log_label', 'labs_license_network_interface', 'network_interface_manufacturer', 'network_interface_model', 'protocol', 'primary_owner'],
    multiple: [],
  },
  License: {
    single: ['sku', 'name', 'license_product', 'license_category', 'maximum_version', 'license_ID', 'log_label', 'status', 'license_restriction', 'carrier_device', 'license_vendor', 'license_type', 'primary_owner'],
    multiple: [],
  },
  DebugHardware: {
    single: ['sku', 'debug_hardware_name', 'debug_hardware_type', 'debug_hardware_manufacturer', 'debug_hardware_model', 'license_version', 'serial_number', 'log_label', 'labs_license_debug_hardware', 'primary_owner'],
    multiple: [],
  },
  PowerSupply: {
    single: ['sku', 'powersupply_name', 'powersupply_type', 'powersupply_manufacturer', 'powersupply_model', 'serial_number', 'log_label', 'labs_license_powersupply', 'primary_owner'],
    multiple: [],
  },
  Monitor: {
    single: ['sku', 'monitor_name', 'monitor_type', 'monitor_manufacturer', 'monitor_model', 'monitor_size', 'serial_number', 'log_label', 'labs_license_monitor', 'primary_owner'],
    multiple: [],
  },
  Accessory: {
    single: ['sku', 'accessory_name', 'accessory_type', 'accessory_manufacturer', 'accessory_model', 'serial_number', 'log_label', 'labs_license_accessory', 'primary_owner'],
    multiple: [],
  },
  Rack: {
    single: ['sku', 'name', 'rack_manufacturer', 'primary_owner', 'room'],
    multiple: ['lab_equipment_list'],
  },
  Room: {
    single: ['room_name', 'country', 'city', 'location_name', 'primary_owner'],
    multiple: ['rack_list'],
  },
};