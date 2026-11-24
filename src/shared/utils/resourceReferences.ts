export type NamedReference = { id: number; name: string };
export type Ownership = {
  department?: NamedReference | null;
  group?: NamedReference | null;
  primary_owner?: { id: number } | null;
};

export function namedReference(value: unknown): NamedReference | null {
  if (!value || typeof value !== 'object' || !('id' in value) || !('name' in value)) return null;
  if (typeof value.id !== 'number' || typeof value.name !== 'string') return null;
  return { id: value.id, name: value.name };
}

export function nullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function ownershipFormValues(resource: Ownership) {
  return {
    department_id: resource.department?.id ?? null,
    group_id: resource.group?.id ?? null,
    owner_id: resource.primary_owner?.id ?? null,
  };
}

export function ownershipPayload(values: Record<string, unknown>, previous?: Ownership) {
  const current = previous && ownershipFormValues(previous);
  return {
    department_id: changedReference(values.department_id, current?.department_id),
    group_id: changedReference(values.group_id, current?.group_id),
    owner_id: changedReference(values.owner_id, current?.owner_id),
  };
}

export function changedReference(value: unknown, previous?: number | null) {
  const next = nullableNumber(value);
  return next === (previous ?? null) ? undefined : next;
}
