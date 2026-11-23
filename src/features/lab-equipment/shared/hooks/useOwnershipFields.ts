import { useState } from 'react';
import { useLabsDepartmentsOptionsRetrieveQuery, useLabsGroupsOptionsRetrieveQuery } from '@/shared/api/generated/api';
import { useGetUsersQuery } from '../api/dropdownApi';
import type { FieldConfig } from '../components/modals/EquipmentFormModal';
import { toUserOption } from '@/shared/utils/userOption';
import { nullableNumber, type NamedReference, type Ownership } from '@/shared/utils/resourceReferences';

export function referenceOptions(rows: NamedReference[] = [], current?: NamedReference | null) {
  const options = rows.map(({ id, name }) => ({ label: name, value: id }));
  if (current && !options.some(({ value }) => value === current.id)) {
    options.push({ label: current.name, value: current.id });
  }
  return options;
}

export function useOwnershipFields(open: boolean, editing: (Ownership & {
  primary_owner?: Parameters<typeof toUserOption>[0] | null;
}) | null, includeOwner = true) {
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');

  const departments = useLabsDepartmentsOptionsRetrieveQuery(
    { q: departmentSearch.trim() || undefined, includeIds: editing?.department ? [editing.department.id] : undefined },
    { skip: !open },
  );
  const currentGroup = departmentId === (editing?.department?.id ?? null) ? editing?.group : null;
  const groups = useLabsGroupsOptionsRetrieveQuery(
    { departmentId: departmentId ?? undefined, q: groupSearch.trim() || undefined, includeIds: currentGroup ? [currentGroup.id] : undefined },
    { skip: !open },
  );
  const { data: users } = useGetUsersQuery();
  const ownerOptions = (users ?? []).map(toUserOption);
  if (editing?.primary_owner && !ownerOptions.some(({ value }) => value === editing.primary_owner?.id)) {
    ownerOptions.push(toUserOption(editing.primary_owner));
  }

  const departmentOptions = referenceOptions(departments.currentData?.data, editing?.department);
  const groupOptions = referenceOptions(groups.currentData?.data, currentGroup);

  const fields: FieldConfig[] = [
    {
      name: 'department_id', apiField: 'department', label: 'Department', type: 'select', section: 'Ownership',
      options: departmentOptions,
      loading: departments.isFetching, onSearch: setDepartmentSearch,
    },
    {
      name: 'group_id', apiField: 'group', label: 'Owning group', type: 'select', section: 'Ownership',
      dependsOn: ['department_id'], options: groupOptions,
      loading: groups.isFetching, onSearch: setGroupSearch,
    },
  ];
  if (includeOwner) fields.push({ name: 'owner_id', apiField: 'owner', label: 'Owner', type: 'select', essential: true, options: ownerOptions });

  return {
    fields,
    setDepartmentId: (value: unknown) => setDepartmentId(nullableNumber(value)),
    departmentOptions,
    groupOptions,
    setDepartmentSearch,
    setGroupSearch,
  };
}
