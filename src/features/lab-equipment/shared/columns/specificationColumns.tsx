import { Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Ownership } from '@/shared/utils/resourceReferences';

interface SpecificationField {
  name: string;
  label: string;
  type?: 'number' | 'text' | 'textarea' | 'date' | 'datetime' | 'json' | 'json-object';
}

function specificationText(value: unknown, type: SpecificationField['type']): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return Object.keys(value).length ? JSON.stringify(value) : null;
  if (type === 'datetime' && typeof value === 'string') {
    const date = dayjs(value);
    if (date.isValid()) return date.format('YYYY-MM-DD HH:mm');
  }
  return String(value);
}

export function specificationColumns<T>(fields: readonly SpecificationField[]): ColumnsType<T> {
  return fields.map(({ name, label, type }) => ({
    title: label,
    dataIndex: name,
    key: name,
    width: type === 'json-object' || type === 'json' || type === 'textarea' ? 200 : 170,
    ellipsis: { showTitle: false },
    render: (value: unknown) => {
      const text = specificationText(value, type);
      return text == null ? '—' : <Tooltip title={text}><span>{text}</span></Tooltip>;
    },
  }));
}

export function ownershipColumns<T extends Ownership>(): ColumnsType<T> {
  return [
    { title: 'Department', key: 'department', width: 160, render: (_, record) => record.department?.name ?? '—' },
    { title: 'Group', key: 'group_id', width: 140, render: (_, record) => record.group?.name ?? '—' },
  ];
}
