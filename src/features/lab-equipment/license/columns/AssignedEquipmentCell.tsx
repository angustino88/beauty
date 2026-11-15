import { Select, Tag, Tooltip } from 'antd';
import { equipmentLabel } from '../equipmentLabel';
import { useEquipmentSearchOptions } from '../hooks/useEquipmentSearchOptions';
import type { IAssignedEquipment } from '../types';

const VISIBLE_TAGS = 3;

interface Props {
  assigned: IAssignedEquipment[];
  editing: boolean;
  value: number[];
  onChange: (ids: number[]) => void;
  seats?: number | null;
}

/** The equipment holding the license's seats; while editing, a searchable multi-select to change them. */
export default function AssignedEquipmentCell({ assigned, editing, value, onChange, seats }: Props) {
  const { options, onSearch, loading } = useEquipmentSearchOptions(assigned);

  if (editing) {
    return (
      <Select
        mode="multiple"
        allowClear
        showSearch
        filterOption={false}
        style={{ width: '100%' }}
        placeholder="Type to search equipment"
        notFoundContent="Type a name or SKU to find equipment"
        loading={loading}
        value={value}
        options={options}
        onSearch={onSearch}
        onChange={(ids: number[]) => onChange(ids)}
        maxCount={seats ?? undefined}
      />
    );
  }

  if (assigned.length === 0) return <span style={{ color: 'var(--lm-text-tertiary)' }}>Not assigned</span>;

  const visible = assigned.slice(0, VISIBLE_TAGS);
  const hidden = assigned.slice(VISIBLE_TAGS);
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
      {visible.map((item) => <Tag key={item.id} style={{ marginInlineEnd: 0 }}>{equipmentLabel(item)}</Tag>)}
      {hidden.length > 0 && (
        <Tooltip title={hidden.map(equipmentLabel).join(', ')}>
          <Tag style={{ marginInlineEnd: 0 }}>+{hidden.length}</Tag>
        </Tooltip>
      )}
    </span>
  );
}
