import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Form, type FormInstance, Select, Spin, Tooltip } from 'antd';
import { useEffect, useMemo, useRef } from 'react';
import { filterResourceOption } from '@/components/inputs/ResourceOption';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { useGetBenchBookingsQuery, useGetBookingBenchChoicesQuery } from '../api';
import { toBenchChoiceOption } from '../utils/benchChoiceOption';
import { benchColor } from '../utils/benchColors';
import styles from './BookingFilter.module.css';

type BookingFilterProps = {
  form: FormInstance;
  name?: string;
  onFinish: (values: { bench_ids?: number[] }) => void;
};

/** "All" fetches each bench separately, so it is offered only up to this many benches. */
const MAX_ALL_BENCHES = 12;
const MAX_MY_BENCHES = 6;

export const BookingFilter: React.FC<BookingFilterProps> = ({ form, name = 'bench_ids', onFinish }) => {
  const { id: userId } = useAuthState();
  const { data: benchChoices, isFetching, isSuccess } = useGetBookingBenchChoicesQuery({ hasComputing: true });
  const benchOptions = useMemo(() => (benchChoices ?? []).map((bench) => toBenchChoiceOption(bench)), [benchChoices]);
  const benchLabelById = useMemo(
    () => new Map(benchOptions.map((option) => [Number(option.value), String(option.selectedLabel)])),
    [benchOptions],
  );
  const selected: number[] = Form.useWatch(name, form) ?? [];
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "My benches": the benches of my own bookings (same cached query as the booking form's history).
  const { data: myBookings } = useGetBenchBookingsQuery(
    { view_side: 'my_booking', creator_id: userId ?? undefined, page: 1, page_size: 100 },
    { skip: !userId },
  );
  const myBenchIds = useMemo(() => {
    const ids: number[] = [];
    for (const booking of myBookings?.data ?? []) {
      const id = booking.bench?.id;
      if (id != null && benchLabelById.has(id) && !ids.includes(id)) ids.push(id);
      if (ids.length === MAX_MY_BENCHES) break;
    }
    return ids;
  }, [myBookings, benchLabelById]);
  const allBenchIds = useMemo(() => benchOptions.map((option) => Number(option.value)), [benchOptions]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  const submitSoon = () => {
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    submitTimeoutRef.current = setTimeout(() => form.submit(), 300);
  };

  const apply = (ids: number[]) => {
    form.setFieldValue(name, ids);
    submitSoon();
  };

  // A remembered or linked bench that is no longer bookable is dropped once the choices are known.
  useEffect(() => {
    if (!isSuccess || selected.length === 0) return;
    const known = selected.filter((id) => benchLabelById.has(id));
    if (known.length !== selected.length) apply(known);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, benchLabelById, selected.join(',')]);

  const sameSet = (ids: number[]) => ids.length === selected.length && ids.every((id) => selected.includes(id));
  const tooManyForAll = allBenchIds.length > MAX_ALL_BENCHES;

  const quickPicks = (
    // Keep focus in the select so the popup stays open while a pick is applied.
    <div className={styles.quickPicks} onMouseDown={(event) => event.preventDefault()}>
      <span className={styles.quickLabel}>Quick picks</span>
      <Tooltip title={myBenchIds.length ? myBenchIds.map((id) => benchLabelById.get(id)).join(', ') : 'You have no bookings yet'}>
        <button
          type="button"
          className={`${styles.quickPick} ${myBenchIds.length && sameSet(myBenchIds) ? styles.quickPickActive : ''}`}
          disabled={myBenchIds.length === 0}
          onClick={() => apply(myBenchIds)}
        >
          My benches{myBenchIds.length ? ` (${myBenchIds.length})` : ''}
        </button>
      </Tooltip>
      <Tooltip title={tooManyForAll ? `Up to ${MAX_ALL_BENCHES} benches can be shown together` : undefined}>
        <button
          type="button"
          className={`${styles.quickPick} ${allBenchIds.length && sameSet(allBenchIds) ? styles.quickPickActive : ''}`}
          disabled={allBenchIds.length === 0 || tooManyForAll}
          onClick={() => apply(allBenchIds)}
        >
          All ({allBenchIds.length})
        </button>
      </Tooltip>
      <button type="button" className={styles.quickPick} disabled={selected.length === 0} onClick={() => apply([])}>
        Clear
      </button>
    </div>
  );

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={(values) => {
        onFinish({ bench_ids: values[name] });
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
          popupRender={(menu) => (
            <>
              {quickPicks}
              {menu}
            </>
          )}
          tagRender={({ value, label, closable, onClose, isMaxTag }) => {
            // The "+N benches" overflow chip comes through here too, with its placeholder as the label.
            if (isMaxTag || value === undefined || value === null) return <span className={styles.tag}>{label}</span>;
            const id = Number(value);
            const color = selected.length > 1 ? benchColor(selected, id) : undefined;
            return (
              <span className={styles.tag} onMouseDown={(event) => event.preventDefault()}>
                {color && <i className={styles.tagDot} style={{ background: color }} aria-hidden="true" />}
                <span className={styles.tagText}>{benchLabelById.get(id) ?? `Bench #${id}`}</span>
                {closable && (
                  <button type="button" className={styles.tagClose} aria-label="Remove bench" onClick={onClose}>
                    <CloseOutlined />
                  </button>
                )}
              </span>
            );
          }}
          maxTagPlaceholder={(omitted) => (
            <Tooltip
              title={(
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {omitted.map((item) => {
                    const id = Number(item.value);
                    const color = benchColor(selected, id);
                    return (
                      <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {color && <i className={styles.tagDot} style={{ background: color }} aria-hidden="true" />}
                        {benchLabelById.get(id) ?? item.label}
                      </span>
                    );
                  })}
                </div>
              )}
            >
              <span>+{omitted.length} {omitted.length === 1 ? 'bench' : 'benches'}</span>
            </Tooltip>
          )}
          notFoundContent={isFetching ? <Spin size="small" /> : 'No benches found'}
          optionLabelProp="selectedLabel"
          filterOption={filterResourceOption}
          onChange={submitSoon}
        />
      </Form.Item>
    </Form>
  );
};

export default BookingFilter;
