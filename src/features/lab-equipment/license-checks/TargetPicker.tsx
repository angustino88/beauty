import { useState } from 'react';
import { Button, Select, Tag } from 'antd';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useLabsBenchesOptionsRetrieveQuery,
  useLabsEquipmentCategoriesOptionsRetrieveQuery,
  useLabsRoomsOptionsRetrieveQuery,
  useLabsStationsOptionsRetrieveQuery,
  type LicenseCheckTargetRequestKindEnum,
} from '@/shared/api/generated/api';
import { KIND_LABEL, TARGET_KINDS, type PickedTarget } from './targets';
import styles from './LicenseChecks.module.css';
import { equipmentPagedConfig, usePagedOptions } from '@/shared/hooks/usePagedOptions';

/** Options of the chosen kind; the other queries stay idle. */
function useTargetOptions(kind: LicenseCheckTargetRequestKindEnum, search: string) {
  const q = search.trim();
  const arg = (active: boolean) => (active ? { q: q || undefined } : skipToken);
  const benches = useLabsBenchesOptionsRetrieveQuery(arg(kind === 'bench'));
  const stations = useLabsStationsOptionsRetrieveQuery(arg(kind === 'station'));
  const rooms = useLabsRoomsOptionsRetrieveQuery(arg(kind === 'room'));
  const categories = useLabsEquipmentCategoriesOptionsRetrieveQuery(arg(kind === 'category'));
  // Equipment is a large catalog: browse the paginated list (pages load as the user scrolls).
  const equipment = usePagedOptions({
    ...equipmentPagedConfig,
    enabled: kind === 'equipment',
    toOption: (row: { id: number; name?: string | null; sku?: string | null }) => ({
      ...equipmentPagedConfig.toOption(row),
      name: row.name ?? row.sku ?? `#${row.id}`,
    }),
  });
  if (kind === 'equipment') {
    return { loading: equipment.loading, options: equipment.options, equipment };
  }
  const active = { bench: benches, station: stations, room: rooms, category: categories }[kind];
  return {
    loading: active.isFetching,
    options: (active.data?.data ?? []).map((option) => ({
      value: option.id,
      label: option.sku ? `${option.name} · ${option.sku}` : option.name,
      name: option.name,
    })),
    equipment,
  };
}

/** Where a check runs: a list of benches, stations, rooms, equipment categories or computers. */
export function TargetPicker({ value, onChange }: { value: PickedTarget[]; onChange: (targets: PickedTarget[]) => void }) {
  const [kind, setKind] = useState<LicenseCheckTargetRequestKindEnum>('bench');
  const [search, setSearch] = useState('');
  const { options, loading, equipment } = useTargetOptions(kind, search);
  const isEquipment = kind === 'equipment';
  const taken = new Set(value.map((target) => `${target.kind}:${target.target_id}`));

  return (
    <div className={styles.field}>
      <div className={styles.targetRow}>
        <Select
          aria-label="Target kind"
          value={kind}
          onChange={(next) => { setKind(next); setSearch(''); equipment.reset(); }}
          options={TARGET_KINDS}
          style={{ width: 190 }}
        />
        <Select
          showSearch
          aria-label="Add target"
          placeholder={isEquipment ? 'Add a computer: choose, or type a name or SKU' : `Add a ${KIND_LABEL[kind].toLowerCase()}`}
          filterOption={false}
          onSearch={isEquipment ? equipment.onSearch : setSearch}
          onOpenChange={isEquipment ? equipment.onOpenChange : undefined}
          onPopupScroll={isEquipment ? equipment.onPopupScroll : undefined}
          popupRender={isEquipment ? equipment.popupRender : undefined}
          loading={loading}
          value={null}
          options={options.filter((option) => !taken.has(`${kind}:${option.value}`))}
          onChange={(id: number) => {
            const picked = options.find((option) => option.value === id);
            if (picked) onChange([...value, { kind, target_id: id, name: picked.name }]);
          }}
          notFoundContent={isEquipment ? equipment.emptyText : 'Nothing found'}
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
