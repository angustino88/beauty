import { PlusOutlined } from '@ant-design/icons';
import { Button, DatePicker, Divider, Input, type InputRef, Space, type GetProps, type GetRef } from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';

const { RangePicker } = DatePicker;
type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;
type RangePickerRef = GetRef<typeof RangePicker>;

interface FilterOption {
  value: string;
  label: string;
}

interface CustomOptionProps {
  setOptions: (updater: (old: FilterOption[]) => FilterOption[]) => void;
}

export function CustomRankOption({ setOptions }: CustomOptionProps) {
  const customInputRef = useRef<InputRef>(null);
  const [customOption, setCustomOption] = useState('');

  const addOption = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const top = Number(customOption);
    if (!Number.isSafeInteger(top) || top < 1) return;
    setOptions((old) => old.some((option) => option.value === String(top)) ? old : [...old, { value: String(top), label: `Top ${top}` }]);
    setCustomOption('');
    setTimeout(() => customInputRef.current?.focus(), 0);
  };

  return (
    <>
      <Divider style={{ margin: '8px 0' }} />
      <Space style={{ padding: '0 8px 4px ' }}>
        <Input
          ref={customInputRef}
          value={customOption}
          type="number"
          min={1}
          step={1}
          onChange={(event) => setCustomOption(event.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <Button type="text" icon={<PlusOutlined />} onClick={addOption} disabled={!Number.isSafeInteger(Number(customOption)) || Number(customOption) < 1}>
          Add item
        </Button>
      </Space>
    </>
  );
}

export function CustomRangeOption({
  setOptions,
  ...props
}: CustomOptionProps & { onOpenChange?: (isOpen: boolean) => void }) {
  const [rangeValue, setRangeValue] = useState<[string, string] | null>(null);
  const rangeRef = useRef<RangePickerRef>(null);

  const onRangeChange = (_dates: unknown, dateStrings: [string, string]) => {
    if (dateStrings[0] && dateStrings[1]) setRangeValue(dateStrings);
    else setRangeValue(null);
  };

  const addRangeOption = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!rangeValue) return;
    const label = `${dayjs(rangeValue[0]).format('YYYY-MM-DD')} - ${dayjs(rangeValue[1]).format('YYYY-MM-DD')}`;
    setOptions((old) => [...old, { value: label, label }]);
    setRangeValue(null);
    setTimeout(() => rangeRef.current?.focus(), 0);
  };

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return !!(current && [0, 6].includes(current.day()));
  };

  return (
    <>
      <Divider style={{ margin: '8px 0' }} />
      <Space style={{ padding: '0 8px 4px' }}>
        <RangePicker
          ref={rangeRef}
          value={rangeValue ? [dayjs(rangeValue[0]), dayjs(rangeValue[1])] : null}
          onChange={onRangeChange}
          disabledDate={disabledDate}
          onKeyDown={(e) => e.stopPropagation()}
          onOpenChange={props.onOpenChange}
          {...props}
        />
        <Button type="text" icon={<PlusOutlined />} onClick={addRangeOption} disabled={!rangeValue} />
      </Space>
    </>
  );
}
