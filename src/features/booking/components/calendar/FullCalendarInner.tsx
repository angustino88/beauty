import FullCalendar from '@fullcalendar/react';
import type { EventContentArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { type Dispatch, type RefObject, type SetStateAction } from 'react';
import styles from './Calendar.module.css';
import dayjs, { type Dayjs } from 'dayjs';
import { Popover } from 'antd';
import { EventDetailModal } from './EventDetailModal';
import { DATE_FORMAT } from '@/shared/utils/booking';

type CalendarEventContentProps = {
  arg: EventContentArg;
  refetchBooking: () => void;
};

const CalendarEventContent = ({ arg, refetchBooking }: CalendarEventContentProps) => {
  const { timeText, event, view } = arg;
  const creator = event.extendedProps?.creator as string | undefined;
  const isMonthView = view.type === 'dayGridMonth';
  const isListView = view.type.startsWith('list');
  const durationMinutes = event.start && event.end
    ? dayjs(event.end).diff(dayjs(event.start), 'minute')
    : 0;
  const isCompactEvent = !event.allDay && durationMinutes <= 45;
  const compactTimeText = event.start ? dayjs(event.start).format('h:mm A') : timeText;
  const showCreator = durationMinutes >= 90;

  const content = isMonthView ? (
    <div className={styles.monthEvent}>
      {timeText && <span className={styles.monthEventTime}>{timeText}</span>}
      <span className={styles.monthEventTitle}>{event.title}</span>
    </div>
  ) : isListView ? (
    <div className={styles.listEventContent}>
      <span className={styles.listEventTitle}>{event.title}</span>
      {creator && (
        <span className={styles.creatorBadge} title={creator}>
          <span className={styles.creatorInitial} aria-hidden="true">{creator.charAt(0).toUpperCase()}</span>
          <span className={styles.creatorName}>{creator}</span>
        </span>
      )}
    </div>
  ) : isCompactEvent ? (
    <div className={styles.compactTimeGridEvent} title={`${timeText} ${event.title}`}>
      {compactTimeText && <span className={styles.compactEventTime}>{compactTimeText}</span>}
      <span className={styles.compactEventTitle}>{event.title}</span>
    </div>
  ) : (
    <div className={styles.timeGridEvent}>
      {timeText && <span className={styles.timeGridEventTime}>{timeText}</span>}
      <span className={styles.timeGridEventTitle} title={event.title}>{event.title}</span>
      {creator && showCreator && (
        <span className={styles.timeGridEventCreator} title={creator}>
          <span aria-hidden="true">{creator.charAt(0).toUpperCase()}</span>
          {creator}
        </span>
      )}
    </div>
  );

  if (event.extendedProps?.isDowntime) {
    const condition = event.extendedProps.condition as string | undefined;
    const reason = event.extendedProps.reason as string | undefined;
    const notes = event.extendedProps.notes as string | undefined;

    return (
      <Popover
        placement="right"
        title="Downtime / Maintenance"
        content={(
          <div style={{ maxWidth: 280, padding: 4 }}>
            <div><strong>Condition:</strong> {condition || 'Unavailable'}</div>
            <div><strong>Reason:</strong> {reason || 'Maintenance'}</div>
            {event.start && (
              <div><strong>Starts:</strong> {dayjs(event.start).format('YYYY-MM-DD HH:mm')}</div>
            )}
            {event.end && (
              <div><strong>Ends:</strong> {dayjs(event.end).format('YYYY-MM-DD HH:mm')}</div>
            )}
            {notes && <div style={{ marginTop: 4 }}><strong>Notes:</strong> {notes}</div>}
          </div>
        )}
      >
        {content}
      </Popover>
    );
  }

  return (
    <Popover
      overlayInnerStyle={{ padding: 0 }}
      content={(
        <EventDetailModal
          refetchBooking={refetchBooking}
          eventId={event.id}
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
      height="65vh"
      initialView="timeGridWeek"
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
