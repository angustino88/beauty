import { Button, Select, Space, Spin, Typography } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import type { RoomLocationOptions } from '../hooks/useRoomLocationOptions';

export function roomLocationColumnFilter(label: string, field: RoomLocationOptions[keyof RoomLocationOptions]) {
  return {
    filterMultiple: false,
    filterOnClose: false,
    filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <Space orientation="vertical" style={{ width: 256, padding: 12 }} onKeyDown={(event) => event.stopPropagation()}>
        <Select
          aria-label={`Filter by ${label}`}
          placeholder={`Select ${label.toLowerCase()}`}
          value={selectedKeys[0] == null ? undefined : Number(selectedKeys[0])}
          options={field.options}
          loading={field.loading}
          disabled={field.disabled}
          showSearch={{ filterOption: false, onSearch: field.onSearch }}
          notFoundContent={field.loading ? <Spin size="small" /> : field.searchHint}
          onChange={(value) => setSelectedKeys([value])}
          style={{ width: '100%' }}
        />
        {field.disabled && <Typography.Text type="secondary">{field.searchHint}</Typography.Text>}
        <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button size="small" disabled={!selectedKeys.length} onClick={() => {
            field.onSearch('');
            clearFilters?.({ confirm: true, closeDropdown: true });
          }}>Reset</Button>
          <Button size="small" type="primary" disabled={field.disabled} onClick={() => {
            field.onSearch('');
            confirm();
          }}>Apply</Button>
        </Space>
      </Space>
    ),
  };
}
