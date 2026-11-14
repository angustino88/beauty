import { Button, Tooltip } from 'antd';
import { InfoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { IChangeLog } from '../types/equipment.types';
import EquipmentStatus from '../components/status/EquipmentStatus';
import LicenseStatus from '../components/status/LicenseStatus';
import { equipmentStatusValue } from '../utils/equipmentStatus';

const formatDate = (value: string | null | undefined): string =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—';

const renderChangedBy = (record: IChangeLog): string => {
  if (record.changed_by?.display_name) return record.changed_by.display_name;
  if (record.last_modified_by?.display_name) return record.last_modified_by.display_name;
  const responsible = record.status_data?.responsible;
  if (responsible && typeof responsible === 'object' && 'display_name' in responsible) {
    const name = (responsible as { display_name?: unknown }).display_name;
    return typeof name === 'string' && name.trim() ? name : '—';
  }
  return 'N/A';
};

const readStatus = (record: IChangeLog): string =>
  equipmentStatusValue(record.status_type) ||
  equipmentStatusValue(record.status) ||
  equipmentStatusValue(record.field_changed);

export const createChangeLogColumns = (
  onViewDetails: (record: IChangeLog) => void,
): ColumnsType<IChangeLog> => [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    align: 'center',
    width: 100,
  },
  {
    title: 'Changed On',
    key: 'created',
    align: 'center',
    width: 180,
    render: (_: unknown, record: IChangeLog) => formatDate(record.created ?? record.modified ?? null),
  },
  {
    title: 'Changed By',
    key: 'changed_by',
    width: 160,
    render: (_: unknown, record: IChangeLog) => renderChangedBy(record),
  },
  {
    title: 'Status',
    key: 'status',
    align: 'center',
    width: 150,
    render: (_: unknown, record: IChangeLog) => {
      const status = readStatus(record);
      if (!status) return '—';
      return record.labdevice_type === 'license'
        ? <LicenseStatus status={status} />
        : <EquipmentStatus status={status} />;
    },
  },
  {
    title: 'Details',
    key: 'details',
    fixed: 'right',
    width: 80,
    align: 'center',
    render: (_: unknown, record: IChangeLog) => (
      <Tooltip title="View change details">
        <Button aria-label="View change details" icon={<InfoOutlined />} onClick={() => onViewDetails(record)} />
      </Tooltip>
    ),
  },
];
