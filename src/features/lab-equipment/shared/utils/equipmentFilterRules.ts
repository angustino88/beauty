import type { EquipmentFilterRules } from '../api/equipmentFilterApi';

export const EQUIPMENT_FILTER_RULES: Record<string, EquipmentFilterRules> = {
  License: {
    single: ['sku', 'name', 'license_product', 'license_category', 'maximum_version', 'license_ID', 'log_label', 'status', 'license_restriction', 'carrier_device', 'license_vendor', 'license_type', 'primary_owner'],
    multiple: [],
  },
};