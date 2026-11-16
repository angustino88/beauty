import type { EquipmentCategoryConfig } from '../../categories/registry';
import type { EquipmentItem } from '../../types/equipment';
import type { FieldConfig } from '../components/modals/EquipmentFormModal';

export function buildEquipmentFormFields({
  config, formMode, refData, departmentOptions, groupOptions, kindFormOptions, typeFormOptions,
  manufacturerFormOptions, modelFormOptions, onDepartmentSearch, onGroupSearch,
}: {
  config: EquipmentCategoryConfig;
  formMode: 'create' | 'edit';
  refData?: {
    owners?: Array<{ id: number; name: string }>;
  } & Record<string, unknown>;
  departmentOptions?: Array<{ id: number; name: string }>;
  groupOptions?: Array<{ id: number; name: string }>;
  kindFormOptions: FieldConfig['options'];
  typeFormOptions: FieldConfig['options'];
  manufacturerFormOptions: FieldConfig['options'];
  modelFormOptions: FieldConfig['options'];
  onDepartmentSearch: (search: string) => void;
  onGroupSearch: (search: string) => void;
}): FieldConfig[] {
  const fields: FieldConfig[] = [
    { name: 'sku', label: 'SKU', type: 'text', required: true, maxLength: 255, placeholder: 'Enter equipment SKU', disabledInEdit: true },
    { name: 'name', label: 'Name', type: 'text', essential: true, placeholder: `Enter ${config.singular.toLowerCase()} name` },
    { name: 'kind_id', label: 'Kind', type: 'select', required: true, options: kindFormOptions },
    { name: 'type_id', label: 'Type', type: 'select', dependsOn: ['kind_id'], options: typeFormOptions },
    { name: 'manufacturer_id', label: 'Manufacturer', type: 'select', dependsOn: ['kind_id'], options: manufacturerFormOptions },
    { name: 'product_model_id', label: 'Product Model', type: 'select', dependsOn: ['type_id', 'manufacturer_id'], options: modelFormOptions },
    { name: 'serial_number', label: 'Serial Number', type: 'text', placeholder: 'Manufacturer serial number' },
    { name: 'log_label', label: 'LOG Label', type: 'text', placeholder: 'Legacy asset or log label' },
    { name: 'owner_id', label: 'Primary Owner', type: 'select', options: refData?.owners?.map((o) => ({ label: o.name, value: o.id })) ?? [] },
    { name: 'department_id', label: 'Department', type: 'select', options: departmentOptions?.map((d) => ({ label: d.name, value: d.id })) ?? [], onSearch: onDepartmentSearch },
    { name: 'group_id', label: 'Group', type: 'select', dependsOn: ['department_id'], options: groupOptions?.map((group) => ({ label: group.name, value: group.id })) ?? [], onSearch: onGroupSearch },
    { name: 'warranty_end_date', label: 'Warranty Until', type: 'date', placeholder: 'Select warranty expiration date' },
    { name: 'replacement_date', label: 'Replacement Date', type: 'date', placeholder: 'Select replacement date' },
    { name: 'image', label: 'Image', type: 'image' },
  ];

  for (const extra of config.extraFields ?? []) {
    if (formMode === 'edit' && extra.createOnly) continue;
    const refOptions = extra.referenceKey && extra.referenceKey !== 'departments' && extra.referenceKey !== 'storage_rooms'
      ? refData?.[extra.referenceKey] : undefined;
    const mappedOptions = Array.isArray(refOptions)
      ? refOptions.map((option: { id: number; name?: string; size?: number; resolution?: string }) => ({
          label: 'name' in option ? option.name : 'size' in option ? String(option.size) : 'resolution' in option ? option.resolution : String(option.id),
          value: option.id,
        }))
      : undefined;
    fields.push({ name: extra.name, label: extra.label, type: extra.type, placeholder: extra.placeholder,
      options: extra.options ?? mappedOptions, disabledInEdit: extra.createOnly });
  }

  fields.push({ name: 'details', label: 'Details', type: 'textarea' });
  const sectionByField: Record<string, string> = {
    sku: 'Identification', name: 'Identification', serial_number: 'Identification', log_label: 'Identification',
    kind_id: 'Classification', type_id: 'Classification', manufacturer_id: 'Classification', product_model_id: 'Classification',
    owner_id: 'Ownership & location', department_id: 'Ownership & location', group_id: 'Ownership & location',
    image: 'Identification',
    warranty_end_date: 'Lifecycle', replacement_date: 'Lifecycle', details: 'Notes',
  };
  return fields.map((field) => ({ ...field,
    section: sectionByField[field.name] ?? 'Specifications',
    essential: field.essential || field.name === 'owner_id',
  }));
}

export function equipmentFormInitialValues(editingItem: EquipmentItem | null, config: EquipmentCategoryConfig) {
  if (!editingItem) return undefined;
  const extraValues: Record<string, unknown> = {};
  for (const field of config.extraFields ?? []) {
    const relationKey = field.name.endsWith('_id') ? field.name.slice(0, -3) : field.name.endsWith('_ids') ? field.name.slice(0, -4) : undefined;
    const relationValue = relationKey ? editingItem[relationKey] : undefined;
    const relationIds = (value: unknown): Array<string | number> => {
      const values = Array.isArray(value) ? value : value == null ? [] : [value];
      return values
        .map((item) => typeof item === 'object' && item !== null ? (item as { id?: unknown }).id : item)
        .filter((id): id is string | number => typeof id === 'string' || typeof id === 'number');
    };
    const displayValue = field.name.endsWith('_ids')
      ? relationIds(relationValue ?? editingItem[field.name])
      : field.name === 'dimensions'
        ? editingItem[field.name]
        : relationKey && relationValue && typeof relationValue === 'object'
          ? (relationValue as { id?: unknown }).id
          : editingItem[field.name];
    extraValues[field.name] = field.type === 'textarea' && displayValue && typeof displayValue !== 'string'
      ? JSON.stringify(displayValue, null, 2)
      : displayValue;
  }

  return {
    sku: editingItem.sku, name: editingItem.name,
    kind_id: editingItem.kind?.id, type_id: editingItem.type?.id,
    manufacturer_id: editingItem.manufacturer?.id, product_model_id: editingItem.product_model?.id,
    serial_number: editingItem.serial_number, log_label: editingItem.log_label,
    owner_id: editingItem.owner?.id, department_id: editingItem.department?.id,
    group_id: editingItem.group?.id,
    warranty_until: editingItem.warranty_end_date, replacement_date: editingItem.replacement_date,
    details: editingItem.details, ...extraValues,
  };
}