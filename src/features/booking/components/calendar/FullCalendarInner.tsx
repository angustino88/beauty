import FullCalendar from '@fullcalendar/react';
import type { EventContentArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { type CSSProperties, type Dispatch, type RefObject, type SetStateAction } from 'react';
import styles from './Calendar.module.css';
import dayjs, { type Dayjs } from 'dayjs';
import { Popover } from 'antd';
import { EventDetailModal } from './EventDetailModal';
import { DowntimeEventDetail, type DowntimeEventInfo } from './DowntimeEventDetail';
import { ExclamationCircleOutlined, ToolOutlined } from '@ant-design/icons';
import { DATE_FORMAT } from '@/shared/utils/booking';
import type { BenchBookingItem } from '../../types';

// Tinted pairs from the theme. Green and orange are left out: they are the "mine" and "others'" booking fills.
const INITIAL_TONES = ['primary', 'info', 'reserved', 'danger', 'neutral'] as const;

function creatorInitialStyle(name: string): CSSProperties {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const tone = INITIAL_TONES[Math.abs(hash) % INITIAL_TONES.length];
  return {
    color: `var(--lm-${tone}-fg)`,
    background: `var(--lm-${tone}-bg)`,
    borderColor: `var(--lm-${tone}-border)`,
  };
}

const CreatorInitial = ({ name, className }: { name: string; className: string }) => (
  <span className={className} style={creatorInitialStyle(name)} aria-hidden="true">
    {name.trim().charAt(0).toUpperCase() || '?'}
  </span>
);

type CalendarEventContentProps = {
  arg: EventContentArg;
  refetchBooking: () => void;
};

const CalendarEventContent = ({ arg, refetchBooking }: CalendarEventContentProps) => {
  const { timeText, event, view } = arg;
  const creator = event.extendedProps?.creator as string | undefined;
  const hoverTitle = event.title;
  const isMonthView = view.type === 'dayGridMonth';
  const isListView = view.type.startsWith('list');
  const durationMinutes = event.start && event.end
    ? dayjs(event.end).diff(dayjs(event.start), 'minute')
    : 0;
  const isCompactEvent = !event.allDay && durationMinutes <= 45;
  const compactTimeText = event.start ? dayjs(event.start).format('h:mm A') : timeText;
  const showCreator = durationMinutes >= 90;
  const benchColor = event.extendedProps?.benchColor as string | undefined;
  const benchSku = event.extendedProps?.benchSku as string | undefined;
  const benchDot = benchColor
    ? <i className={styles.benchDot} style={{ background: benchColor }} title={benchSku} aria-label={benchSku} />
    : null;

  const content = isMonthView ? (
    <div className={styles.monthEvent}>
      {benchDot}
      {timeText && <span className={styles.monthEventTime}>{timeText}</span>}
      <span className={styles.monthEventTitle}>{event.title}</span>
    </div>
  ) : isListView ? (
    <div className={styles.listEventContent}>
      <span className={styles.listEventTitle}>
        {benchDot && <>{benchDot}{' '}<span className={styles.listBench}>{benchSku}</span>{' · '}</>}
        {event.title}
      </span>
      {creator && (
        <span className={styles.creatorBadge} title={creator}>
          <CreatorInitial name={creator} className={styles.creatorInitial} />
          <span className={styles.creatorName}>{creator}</span>
        </span>
      )}
    </div>
  ) : isCompactEvent ? (
    <div className={styles.compactTimeGridEvent} title={`${benchSku ? `${benchSku} · ` : ''}${timeText} ${hoverTitle}`}>
      {benchDot}
      {compactTimeText && <span className={styles.compactEventTime}>{compactTimeText}</span>}
      <span className={styles.compactEventTitle}>{event.title}</span>
    </div>
  ) : (
    <div className={styles.timeGridEvent}>
      {benchColor && benchSku && (
        <span className={styles.benchLabel} style={{ color: benchColor }}>
          <i className={styles.benchDot} style={{ background: benchColor }} aria-hidden="true" />
          {benchSku}
        </span>
      )}
      {timeText && <span className={styles.timeGridEventTime}>{timeText}</span>}
      <span className={styles.timeGridEventTitle} title={hoverTitle}>{event.title}</span>
      {creator && showCreator && (
        <span className={styles.timeGridEventCreator} title={creator}>
          <CreatorInitial name={creator} className={styles.creatorMark} />
          <span className={styles.creatorText}>{creator}</span>
        </span>
      )}
    </div>
  );

  if (event.extendedProps?.isDowntime) {
    const props = event.extendedProps as DowntimeEventInfo;
    const outOfService = props.conditionValue === 'out_of_service';
    const icon = outOfService ? <ExclamationCircleOutlined /> : <ToolOutlined />;
    const timeLabel = props.openEnded
      ? `${compactTimeText} · until resolved`
      : timeText;
    const downtimeContent = isMonthView || isListView || isCompactEvent ? (
      <div className={styles.downtimeEventCompact}>
        <span className={styles.downtimeIcon}>{icon}</span>
        <span className={styles.downtimeTitle}>{event.title}</span>
        {!isListView && <span className={styles.downtimeTime}>{compactTimeText}</span>}
      </div>
    ) : (
      <div className={styles.downtimeEvent}>
        <span className={styles.downtimeTitleRow}>
          <span className={styles.downtimeIcon}>{icon}</span>
          <span className={styles.downtimeTitle}>{event.title}</span>
        </span>
        {props.reason && <span className={styles.downtimeReason}>{props.reason}</span>}
        <span className={styles.downtimeTime}>{timeLabel}</span>
      </div>
    );

    return (
      <Popover
        placement="right"
        styles={{ container: { padding: 0 } }}
        content={<DowntimeEventDetail info={{ ...props, start: event.start, end: event.end }} />}
      >
        {downtimeContent}
      </Popover>
    );
  }

  return (
    <Popover
      styles={{ container: { padding: 0 } }}
      content={(
        <EventDetailModal
          refetchBooking={refetchBooking}
          eventId={event.id}
          listedBooking={event.extendedProps?.booking as BenchBookingItem | undefined}
        />
      )}
      placement="right"
    >
      {content}
    </Popover>
  );
};

type CustomizedFullCalendarProps = {
  calendarRef: RefObject<FullCalendar | null>;
  view: string;
  events: EventInput[];
  onClickEvent?: (event: EventInput) => void;
  setTitle: Dispatch<SetStateAction<string | undefined>>;
  onSelect: (timeInterval?: {
    starts_at?: Dayjs;
    ends_at?: Dayjs;
  }) => void;
  refetchBooking: () => void;
  onDatesSet?: (range: { start: string; end: string }) => void;
  [key: string]: unknown;
};

const CustomizedFullCalendar = ({
  calendarRef,
  view,
  events,
  onClickEvent,
  setTitle,
  onSelect,
  refetchBooking,
  onDatesSet,
  ...props
}: CustomizedFullCalendarProps) => {
  return (
    <FullCalendar
      {...props}
      eventClassNames={styles.eventlist}
      ref={calendarRef}
      plugins={[interactionPlugin, timeGridPlugin, dayGridPlugin, listPlugin]}
      height={view.startsWith('list') ? 'auto' : '65vh'}
      initialView={view}
      slotEventOverlap={false}
      eventMaxStack={3}
      headerToolbar={false}
      eventClick={onClickEvent}
      slotLabelFormat={{ hour: 'numeric', hour12: true, minute: '2-digit' }}
      eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: true }}
      timeZone="local"
      datesSet={(info) => {
        setTitle(info.view.title);
        onDatesSet?.({
          start: dayjs(info.start).format(DATE_FORMAT),
          end: dayjs(info.end).format(DATE_FORMAT),
        });
      }}
      nowIndicator={true}
      firstDay={1}
      scrollTime={dayjs().subtract(2, 'hour').format('HH') + ':00:00'}
      events={events}
      eventMinHeight={20}
      eventContent={(arg) => <CalendarEventContent arg={arg} refetchBooking={refetchBooking} />}
      selectable={true}
      select={(info) =>
        onSelect({
          starts_at: dayjs(info.startStr),
          ends_at: dayjs(info.endStr),
        })
      }
    />
  );
};

export default CustomizedFullCalendar;
