import { SearchOutlined } from '@ant-design/icons';
import { Form, type FormInstance, Select, Spin, Tooltip } from 'antd';
import { useEffect, useMemo, useRef } from 'react';
import { filterResourceOption } from '@/components/inputs/ResourceOption';
import { useGetBookingBenchChoicesQuery } from '../api';
import { toBenchChoiceOption } from '../utils/benchChoiceOption';

type BookingFilterProps = {
  form: FormInstance;
  name?: string;
  onFinish: (values: { bench_ids?: number[] }) => void;
};

export const BookingFilter: React.FC<BookingFilterProps> = ({ form, name = 'bench_ids', onFinish }) => {
  const { data: benchChoices, isFetching } = useGetBookingBenchChoicesQuery({ hasComputing: true });
  const benchOptions = useMemo(() => (benchChoices ?? []).map((bench) => toBenchChoiceOption(bench)), [benchChoices]);
  const benchLabelById = useMemo(
    () => new Map(benchOptions.map((option) => [Number(option.value), String(option.selectedLabel)])),
    [benchOptions],
  );
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={(values) => {
        onFinish({ bench_ids: values.bench_ids });
      }}
      style={{ display: 'flex', alignItems: 'center', width: '100%' }}
    >
      <Form.Item name={name} style={{ margin: 0, flex: 1, minWidth: 220 }}>
        <Select
          mode="multiple"
          showSearch
          allowClear
          maxTagCount="responsive"
          placeholder="Search benches by SKU, name or computer"
          prefix={<SearchOutlined style={{ color: 'var(--lm-text-tertiary)', marginRight: 4 }} />}
          options={benchOptions}
          maxTagPlaceholder={(omitted) => (
            <Tooltip
              title={(
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {omitted.map((item) => <span key={String(item.value)}>{benchLabelById.get(Number(item.value)) ?? item.label}</span>)}
                </div>
              )}
            >
              <span>+{omitted.length} {omitted.length === 1 ? 'bench' : 'benches'}</span>
            </Tooltip>
          )}
          notFoundContent={isFetching ? <Spin size="small" /> : 'No benches found'}
          optionLabelProp="selectedLabel"
          filterOption={filterResourceOption}
          onChange={() => {
            if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
            submitTimeoutRef.current = setTimeout(() => form.submit(), 300);
          }}
        />
      </Form.Item>
    </Form>
  );
};

export default BookingFilter;
