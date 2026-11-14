import { Col, DatePicker, Form, Select } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { PERIOD } from '../../utils';
import { CustomRangeOption, CustomRankOption } from './CustomOptions';
interface FilterItemProps {
  colSpan?: number;
}

const DEFAULT_COLSPAN = 24;

export function OrderFilterItem({ colSpan }: FilterItemProps) {
  return (
    <Col span={colSpan || DEFAULT_COLSPAN}>
      <Form.Item name="order" style={{ marginBottom: 0 }}>
        <Select
          options={[
            { value: 'desc', label: 'Highest -> Lowest' },
            { value: 'asc', label: 'Lowest -> Highest' },
          ]}
        />
      </Form.Item>
    </Col>
  );
}

export function DateUnitFilterItem({ colSpan }: FilterItemProps) {
  return (
    <Col span={colSpan || DEFAULT_COLSPAN}>
      <Form.Item name="unit" style={{ marginBottom: 0 }}>
        <Select
          options={[
            { value: 'day', label: '1 day' },
            { value: 'week', label: '1 week' },
            { value: 'month', label: '1 month' },
            { value: 'quarter', label: '1 quarter' },
            { value: 'year', label: '1 year' },
          ]}
        />
      </Form.Item>
    </Col>
  );
}

export function RankFilterItem({ colSpan }: FilterItemProps) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([
    { value: '5', label: 'Top 5' },
    { value: '10', label: 'Top 10' },
    { value: '20', label: 'Top 20' },
  ]);

  return (
    <Col span={colSpan || DEFAULT_COLSPAN}>
      <Form.Item name="top" style={{ marginBottom: 0 }}>
        <Select
          options={options}
          dropdownRender={(menu) => (
            <div onMouseDown={(e) => e.preventDefault()}>
              {menu}
              <CustomRankOption
                setOptions={(updater) => setOptions(updater)}
              />
            </div>
          )}
        />
      </Form.Item>
    </Col>
  );
}

export function DateSelectFilterItem({ colSpan }: FilterItemProps) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([
    { value: PERIOD.LAST_WEEK, label: 'Last Week' },
    { value: PERIOD.LAST_MONTH, label: 'Last Month' },
    { value: PERIOD.LAST_QUARTER, label: 'Last Quarter' },
    { value: PERIOD.LAST_YEAR, label: 'Last Year' },
  ]);
  const [dateOpen, setDateOpen] = useState(false);
  const [showOption, setShowOption] = useState(false);

  return (
    <Col span={colSpan || DEFAULT_COLSPAN}>
      <Form.Item name="period" style={{ marginBottom: 0 }}>
        <Select
          options={options}
          open={showOption}
          onOpenChange={(open) => {
            // Guard: don't let Select close while the nested RangePicker calendar is open.
            // In AntD 6, clicking on the calendar portal (rendered in body) blurs the Select
            // and fires onOpenChange(false). We suppress that until the picker closes.
            if (!open && dateOpen) return;
            setShowOption(open);
          }}
          onSelect={() => setShowOption(false)}
          popupRender={(menu) => (
            <div
              onMouseDown={(e) => {
                // Prevent mousedown inside the popup from blurring the Select trigger.
                // This stops AntD 6 from firing onOpenChange(false) when the user
                // interacts with the custom RangePicker row below the preset options.
                e.preventDefault();
              }}
            >
              {menu}
              <CustomRangeOption
                setOptions={(updater) => setOptions(updater)}
                onOpenChange={(isOpen: boolean) => setDateOpen(isOpen)}
              />
            </div>
          )}
        />
      </Form.Item>
    </Col>
  );
}

export function DateFilterItem({ colSpan }: FilterItemProps) {
  return (
    <Col span={colSpan || DEFAULT_COLSPAN}>
      <Form.Item name="log_date" style={{ marginBottom: 0 }}>
        <DatePicker style={{ width: '100%' }} allowClear={false} disabledDate={(current) => !!(current && current > dayjs().endOf('day'))} />
      </Form.Item>
    </Col>
  );
}
