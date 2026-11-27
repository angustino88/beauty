import { useRef, useState } from 'react';
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Space, Tooltip } from 'antd';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';
import {
  useSupportTicketsWorkLogsCreateByKeyMutation,
  useSupportTicketsWorkLogsDestroyByKeyWorkLogIdMutation,
  useSupportTicketsWorkLogsPartialUpdateByKeyWorkLogIdMutation,
  useSupportTicketsWorkLogsRetrieveByKeyQuery,
  useSupportWorkLogsSummaryRetrieveQuery,
  type TicketWorkLogRead,
} from '@/shared/api/generated/api';
import { InlineAlert, notify } from '@/shared/notifications';
import { apiErrorMessage } from '../attachments';
import { formatWorkBreakdown, parseSmartDuration } from '../workDuration';
import { SmartDurationInput } from './SmartDurationInput';
import styles from './SupportTickets.module.css';
import { WorkLogMetrics, WorkLogTable } from './WorkLogTable';

interface EntryFormValues {
  duration: string;
  startedAt: Dayjs;
  description?: string;
}

function isStale(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error
    && (error.status === 412 || error.status === 404);
}

const PAGE_SIZE = 10;

export function TicketWorkLogs({ ticketKey, onUpdated }: {
  ticketKey: string;
  onUpdated: () => unknown;
}) {
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ entry?: TicketWorkLogRead } | null>(null);
  const [error, setError] = useState('');
  const [form] = Form.useForm<EntryFormValues>();
  const replay = useRef<{ body: string; key: string } | null>(null);
  const list = useSupportTicketsWorkLogsRetrieveByKeyQuery({ key: ticketKey, page, pageSize: PAGE_SIZE });
  const summary = useSupportWorkLogsSummaryRetrieveQuery({ scope: 'ticket', ticketKey });
  const [create, createState] = useSupportTicketsWorkLogsCreateByKeyMutation();
  const [update, updateState] = useSupportTicketsWorkLogsPartialUpdateByKeyWorkLogIdMutation();
  const [remove, removeState] = useSupportTicketsWorkLogsDestroyByKeyWorkLogIdMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const openEditor = (entry?: TicketWorkLogRead) => {
    replay.current = null;
    setError('');
    form.resetFields();
    form.setFieldsValue({
      duration: entry ? formatWorkBreakdown(entry.time_spent_minutes) : '',
      startedAt: entry ? dayjs(entry.started_at) : dayjs(),
      description: entry?.description ?? '',
    });
    setEditor({ entry });
  };

  const refresh = async (targetPage = page) => {
    if (targetPage !== page) setPage(targetPage);
    await Promise.all([summary.refetch(), targetPage === page ? list.refetch() : undefined, onUpdated()]);
  };

  const save = async (values: EntryFormValues) => {
    if (!editor || saving) return;
    const parsed = parseSmartDuration(values.duration);
    if (!parsed.ok) {
      form.setFields([{ name: 'duration', errors: [parsed.message] }]);
      return;
    }
    setError('');
    const entry = editor.entry;
    const payload = {
      time_spent_minutes: parsed.minutes,
      started_at: values.startedAt.toISOString(),
      description: values.description?.trim() ?? '',
    };
    try {
      if (entry) {
        await update({
          key: ticketKey,
          workLogId: entry.id,
          'If-Match': entry.etag,
          patchedWorkLogRequest: payload,
        }).unwrap();
      } else {
        const body = JSON.stringify(payload);
        if (replay.current?.body !== body) replay.current = { body, key: crypto.randomUUID() };
        await create({
          key: ticketKey,
          'Idempotency-Key': replay.current.key,
          workLogRequest: payload,
        }).unwrap();
      }
    } catch (failure) {
      if (entry && isStale(failure)) {
        setEditor(null);
        await refresh(1);
        notify.warning('This work entry changed. Open the latest entry to edit it.');
      } else {
        setError(apiErrorMessage(failure, 'Check the entry and try again.'));
      }
      return;
    }
    setEditor(null);
    await refresh(1);
    notify.success(entry ? 'Work entry updated' : 'Work logged');
  };

  const deleteEntry = async (entry: TicketWorkLogRead) => {
    try {
      await remove({ key: ticketKey, workLogId: entry.id, 'If-Match': entry.etag }).unwrap();
      const remainingOnPage = (list.currentData?.data.length ?? 0) - 1;
      await refresh(page > 1 && remainingOnPage === 0 ? page - 1 : page);
      notify.success('Work entry deleted');
    } catch (failure) {
      if (isStale(failure)) {
        await refresh(1);
        notify.warning('This work entry changed. Review the latest entries.');
      } else {
        notify.error('Unable to delete work entry', { description: apiErrorMessage(failure) });
      }
    }
  };

  return (
    <div className={styles.ticketWorkLogs}>
      <div className={styles.workLogSectionHeader}>
        <h3>Time on this ticket</h3>
        <Space wrap>
          <Link to="/support-tickets/work-logs">View work logs report</Link>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>Log work</Button>
        </Space>
      </div>
      {summary.isError && (
        <InlineAlert variant="error" title="Could not load ticket totals" onRetry={() => void summary.refetch()} />
      )}
      <WorkLogMetrics summary={summary.currentData?.data} scope="ticket" />
      {list.isError ? (
        <InlineAlert variant="error" title="Could not load work entries" onRetry={() => void refresh(1)} />
      ) : (
        <WorkLogTable
          rows={list.currentData?.data ?? []}
          page={page}
          pageSize={PAGE_SIZE}
          total={list.currentData?.meta.pagination.count ?? 0}
          onPageChange={setPage}
          loading={list.isFetching}
          emptyLabel="No work logged"
          renderActions={(entry) => (
            <Space size={4}>
              <Button size="small" type="link" onClick={() => openEditor(entry)}>Edit</Button>
              <Popconfirm
                title="Delete this work entry?"
                description="Its time will be removed from the ticket and reports."
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={() => void deleteEntry(entry)}
              >
                <Button type="link" size="small" danger disabled={removeState.isLoading}>Delete</Button>
              </Popconfirm>
            </Space>
          )}
        />
      )}
      <Modal
        title={editor?.entry ? 'Edit work entry' : 'Log work'}
        open={editor !== null}
        width={540}
        okText={editor?.entry ? 'Save changes' : 'Log work'}
        confirmLoading={saving}
        closable={!saving}
        keyboard={!saving}
        mask={{ closable: !saving }}
        cancelButtonProps={{ disabled: saving }}
        onCancel={() => setEditor(null)}
        onOk={() => form.submit()}
        forceRender
      >
        {error && <InlineAlert variant="error" title="Could not save work entry" description={error} />}
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => void save(values)}
          onValuesChange={(changed: Partial<EntryFormValues>) => {
            if (typeof changed.duration === 'string' && parseSmartDuration(changed.duration).ok) {
              form.setFields([{ name: 'duration', errors: [] }]);
            }
          }}
          className={styles.transitionForm}
        >
          <Form.Item
            name="duration"
            required
            validateTrigger={['onBlur', 'onSubmit']}
            label={
              <span className={styles.fieldLabelGroup}>
                <span>Time spent</span>
                <Tooltip title="Supports m, h, d (8h), w (5d / 40h), mo (4w / 160h), H:MM, or plain minutes. Max 240h (14,400 min) per entry.">
                  <InfoCircleOutlined className={styles.fieldInfoIcon} aria-label="Time spent format help" />
                </Tooltip>
              </span>
            }
            rules={[
              {
                validator: (_, rawValue: string | undefined) => {
                  const parsed = parseSmartDuration(rawValue);
                  return parsed.ok ? Promise.resolve() : Promise.reject(new Error(parsed.message));
                },
              },
            ]}
          >
            <SmartDurationInput disabled={saving} onPressEnter={() => form.submit()} />
          </Form.Item>
          <Form.Item name="startedAt" label="Started at" rules={[{ required: true, message: 'Select a date and time.' }]}>
            <DatePicker showTime format="DD MMM YYYY, HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Work performed (optional)"
            extra="People who can view this ticket can see this entry."
          >
            <Input.TextArea rows={3} maxLength={4000} placeholder="Summarize the work you did." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
