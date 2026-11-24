import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type FullCalendar from '@fullcalendar/react';
import type { EventInput } from '@fullcalendar/core';
import { Button, Grid, Radio } from 'antd';
import { lazy, type RefObject, type SetStateAction, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import styles from './Calendar.module.css';
import type { Dayjs } from 'dayjs';

type CalendarProps = {
  events: EventInput[];
  onClickEvent?: SetStateAction<unknown>;
  calendarRef?: RefObject<FullCalendar>;
  onDateChange?: () => void;
  onDateClick?: () => void;
  onSelect: (timeInterval?: {
    starts_at?: Dayjs;
    ends_at?: Dayjs;
  }) => void;
  refetchBooking: () => void;
  onDatesSet?: (range: { start: string; end: string }) => void;
  [key: string]: unknown;
};

const LazyCalendar = lazy(() => import('./FullCalendarInner'));

const VIEW_DEFS = [
  { title: 'Month', key: 'month', desktop: 'dayGridMonth', mobile: 'listMonth' },
  { title: 'Week',  key: 'week',  desktop: 'timeGridWeek', mobile: 'listWeek' },
  { title: 'Day',   key: 'day',   desktop: 'timeGridDay',  mobile: 'listDay' },
] as const;
type ViewKey = typeof VIEW_DEFS[number]['key'] | 'list';

export function Calendar({ events, onClickEvent, onDateClick, onSelect, refetchBooking, onDatesSet }: CalendarProps) {
  const [selectedKey, setSelectedKey] = useState<ViewKey>('week');
  const calendarRef = useRef<FullCalendar | null>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const { md } = Grid.useBreakpoint();

  // Derive actual FC view from the user's logical selection + breakpoint.
  // No useEffect needed — calendarView is pure derived state.
  const calendarView = useMemo(() => {
    if (selectedKey === 'list') return 'listMonth';
    const def = VIEW_DEFS.find((v) => v.key === selectedKey)!;
    return md ? def.desktop : def.mobile;
  }, [selectedKey, md]);

  useEffect(() => {
    // Defer changeView outside React's render cycle — FullCalendar calls flushSync
    // internally which conflicts when called directly inside a useEffect.
    const id = setTimeout(() => {
      const api = calendarRef.current?.getApi();
      if (api && api.view.type !== calendarView) api.changeView(calendarView);
    }, 0);
    return () => clearTimeout(id);
  }, [calendarView]);

  return (
    <>
      <div className={styles.calendarHeader}>
        <Button className={styles.todayButton} onClick={() => calendarRef.current?.getApi().today()}>
          Today
        </Button>
        <div className={styles.calendarTitle}>
          <Button aria-label="Previous date range" icon={<LeftOutlined />} shape="circle" onClick={() => calendarRef.current?.getApi().prev()} />
          <h2>{title}</h2>
          <Button aria-label="Next date range" icon={<RightOutlined />} shape="circle" onClick={() => calendarRef.current?.getApi().next()} />
        </div>
        <div className={styles.calendarViewbar}>
          <Radio.Group
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value as ViewKey)}
          >
            {VIEW_DEFS.map((view) => {
              return (
                <Radio.Button key={view.key} value={view.key}>
                  {view.title}
                </Radio.Button>
              );
            })}
            {md && (
              <Radio.Button key="list" value="list">
                List
              </Radio.Button>
            )}
          </Radio.Group>
        </div>
      </div>
      <div className={styles.calendarSurface}>
        <Suspense fallback={null}>
          <LazyCalendar
            calendarRef={calendarRef}
            view={calendarView}
            events={events}
            onDateClick={onDateClick}
            onClickEvent={onClickEvent as ((event: EventInput) => void) | undefined}
            setTitle={setTitle}
            onSelect={onSelect}
            refetchBooking={refetchBooking}
            onDatesSet={onDatesSet}
          />
        </Suspense>
      </div>
    </>
  );
}
