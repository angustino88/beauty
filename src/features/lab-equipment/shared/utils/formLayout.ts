import type { FieldConfig } from '../components/modals/EquipmentFormModal';

export const SECTION_ORDER = [
  'Identification',
  'Classification',
  'Ownership',
  'Location',
  'Layout',
  'Specifications',
  'License terms',
  'Lifecycle',
  'Notes',
] as const;

export type FormFieldWidth = 'half' | 'full';

/**
 * Resolves a field's track width in the unified 2-column form grid.
 * Multi-line editors, JSON payloads, multi-select tag pickers, and explicitly wide fields
 * span both columns; all other fields occupy one uniform column so vertical rails stay aligned.
 */
export function resolveFieldWidth(field: Pick<FieldConfig, 'type' | 'span'>): FormFieldWidth {
  if (field.span === 24) return 'full';
  if (
    field.type === 'textarea' ||
    field.type === 'json' ||
    field.type === 'json-object' ||
    field.type === 'multi-select'
  ) {
    return 'full';
  }
  return 'half';
}

export interface PartitionedFormSections {
  primarySections: string[];
  additionalSections: string[];
  additionalFieldCount: number;
}

/**
 * Orders form sections consistently and splits primary sections (containing required or essential
 * fields) from optional additional sections.
 */
export function partitionFormSections(
  fields: ReadonlyArray<Pick<FieldConfig, 'section' | 'required' | 'essential' | 'type'>>,
): PartitionedFormSections {
  const regularFields = fields.filter((field) => field.type !== 'image');
  const sections = [...new Set(regularFields.map((field) => field.section ?? 'Identification'))];
  const orderList: readonly string[] = SECTION_ORDER;
  const orderedSections = [
    ...SECTION_ORDER.filter((section) => sections.includes(section)),
    ...sections.filter((section) => !orderList.includes(section)),
  ];
  const essentialSections = new Set(
    regularFields
      .filter((field) => field.required || field.essential)
      .map((field) => field.section ?? 'Identification'),
  );
  const primarySections = orderedSections.filter((section) => essentialSections.has(section));
  const additionalSections = orderedSections.filter((section) => !essentialSections.has(section));
  const additionalSet = new Set(additionalSections);
  const additionalFieldCount = regularFields.filter((field) =>
    additionalSet.has(field.section ?? 'Identification'),
  ).length;

  return { primarySections, additionalSections, additionalFieldCount };
}

/** Human-readable summary shown on the collapsed "Additional details" disclosure bar. */
export function formatAdditionalSummary(
  additionalSections: readonly string[],
  fieldCount: number,
): string {
  const countLabel = `${fieldCount} optional ${fieldCount === 1 ? 'field' : 'fields'}`;
  if (additionalSections.length === 0) return countLabel;
  return `${additionalSections.join(' · ')} · ${countLabel}`;
}
