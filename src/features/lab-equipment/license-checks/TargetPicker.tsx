import { useState } from 'react';
import { Button, Select, Tag } from 'antd';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useLabsBenchesOptionsRetrieveQuery,
  useLabsEquipmentCategoriesOptionsRetrieveQuery,
  useLabsEquipmentOptionsRetrieveQuery,
  useLabsRoomsOptionsRetrieveQuery,
  useLabsStationsOptionsRetrieveQuery,
  type LicenseCheckTargetRequestKindEnum,
} from '@/shared/api/generated/api';
import { KIND_LABEL, TARGET_KINDS, type PickedTarget } from './targets';
import styles from './LicenseChecks.module.css';

/** Options of the chosen kind; the other queries stay idle. */
function useTargetOptions(kind: LicenseCheckTargetRequestKindEnum, search: string) {
  const q = search.trim();
  const arg = (active: boolean) => (active ? { q: q || undefined } : skipToken);
  const benches = useLabsBenchesOptionsRetrieveQuery(arg(kind === 'bench'));
  const stations = useLabsStationsOptionsRetrieveQuery(arg(kind === 'station'));
  const rooms = useLabsRoomsOptionsRetrieveQuery(arg(kind === 'room'));
  const categories = useLabsEquipmentCategoriesOptionsRetrieveQuery(arg(kind === 'category'));
  // Equipment selectors need a search term: there are too many units to list.
  const equipment = useLabsEquipmentOptionsRetrieveQuery(kind === 'equipment' && q.length >= 2 ? { q } : skipToken);
  const active = { bench: benches, station: stations, room: rooms, category: categories, equipment }[kind];
  return {
    loading: active.isFetching,
    options: (active.data?.data ?? []).map((option) => ({
      value: option.id,
      label: option.sku ? `${option.name} · ${option.sku}` : option.name,
      name: option.name,
    })),
  };
}

/** Where a check runs: a list of benches, stations, rooms, equipment categories or computers. */
export function TargetPicker({ value, onChange }: { value: PickedTarget[]; onChange: (targets: PickedTarget[]) => void }) {
  const [kind, setKind] = useState<LicenseCheckTargetRequestKindEnum>('bench');
  const [search, setSearch] = useState('');
  const { options, loading } = useTargetOptions(kind, search);
  const taken = new Set(value.map((target) => `${target.kind}:${target.target_id}`));

  return (
    <div className={styles.field}>
      <div className={styles.targetRow}>
        <Select
          aria-label="Target kind"
          value={kind}
          onChange={(next) => { setKind(next); setSearch(''); }}
          options={TARGET_KINDS}
          style={{ width: 190 }}
        />
        <Select
          showSearch
          aria-label="Add target"
          placeholder={kind === 'equipment' ? 'Type at least 2 characters of a computer' : `Add a ${KIND_LABEL[kind].toLowerCase()}`}
          filterOption={false}
          onSearch={setSearch}
          loading={loading}
          value={null}
          options={options.filter((option) => !taken.has(`${kind}:${option.value}`))}
          onChange={(id: number) => {
            const picked = options.find((option) => option.value === id);
            if (picked) onChange([...value, { kind, target_id: id, name: picked.name }]);
          }}
          notFoundContent={kind === 'equipment' && search.trim().length < 2 ? 'Type at least 2 characters' : 'Nothing found'}
        />
      </div>
      {value.length > 0 && (
        <div className={styles.tags}>
          {value.map((target) => (
            <Tag
              key={`${target.kind}:${target.target_id}`}
              closable
              onClose={() => onChange(value.filter((item) => item !== target))}
            >
              {KIND_LABEL[target.kind]}: {target.name}
            </Tag>
          ))}
          <Button size="small" type="link" onClick={() => onChange([])}>Clear</Button>
        </div>
      )}
    </div>
  );
}
