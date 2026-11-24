import { useState } from 'react';
import { Select, type SelectProps } from 'antd';
import { useSupportPeopleOptionsRetrieveQuery } from '@/shared/api/generated/api';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

interface PersonOption {
  value: number;
  label: string;
}

interface SupportPeopleSelectProps<Value> extends SelectProps<Value, PersonOption> {
  assigneesOnly?: boolean;
  includePeople?: PersonOption[];
  excludeIds?: number[];
  suggestIds?: number[];
}

export function SupportPeopleSelect<Value extends number | number[] | null>({
  value,
  assigneesOnly = false,
  includePeople = [],
  excludeIds = [],
  suggestIds = [],
  placeholder = 'Search by name or username',
  ...props
}: SupportPeopleSelectProps<Value>) {
  const [search, setSearch] = useState('');
  const term = search.trim();
  const debouncedTerm = useDebouncedValue(term, 250);
  const q = debouncedTerm.length >= 2 ? debouncedTerm : undefined;
  const selectedIds = Array.isArray(value) ? value : typeof value === 'number' ? [value] : [];
  const includeIds = [...new Set([...selectedIds, ...(!q ? suggestIds : [])])].slice(0, 50);
  const { currentData, isFetching, isError, error } = useSupportPeopleOptionsRetrieveQuery(
    { q, isAssignee: assigneesOnly || undefined, includeIds: includeIds.length ? includeIds : undefined },
    { skip: !q && !includeIds.length },
  );

  const matchingSearch = term === debouncedTerm;
  const options = new Map<number, PersonOption>();
  for (const person of includePeople) options.set(person.value, person);
  if (matchingSearch) {
    for (const person of currentData?.data ?? []) {
      options.set(person.id, { value: person.id, label: person.name });
    }
  }
  const visibleOptions = [...options.values()].filter((person) => !excludeIds.includes(person.value));
  const tooMany = error && 'status' in error && error.status === 400;
  let emptyText = 'Type at least 2 characters to search';
  if (isFetching || !matchingSearch) emptyText = 'Searching…';
  else if (tooMany) emptyText = 'Enter a more specific name';
  else if (isError) emptyText = 'Could not load people. Try searching again.';
  else if (q) emptyText = 'No matching people';

  return (
    <Select<Value, PersonOption>
      {...props}
      value={value}
      placeholder={placeholder}
      options={visibleOptions}
      loading={isFetching}
      notFoundContent={emptyText}
      showSearch={{ filterOption: false, onSearch: setSearch }}
      onOpenChange={(open) => {
        if (!open) setSearch('');
        props.onOpenChange?.(open);
      }}
    />
  );
}
