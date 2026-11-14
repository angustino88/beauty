import type { FieldConfig } from '../components/modals/EquipmentFormModal';

export function buildRequiredFieldRules(field: Pick<FieldConfig, 'required' | 'type' | 'label'>) {
  if (!field.required) return [];

  return [{
    required: true,
    // Even whitespace: false selects string validation and rejects numeric IDs.
    ...(field.type === 'text' || field.type === 'textarea' ? { whitespace: true } : {}),
    message: `Please ${field.type === 'select' ? 'select' : 'enter'} ${field.label}`,
  }];
}