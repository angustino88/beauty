import { useRef, useState } from 'react';
import { Button, DatePicker, Empty, Form, Input, InputNumber, List, Modal, Pagination, Popconfirm, Space, Spin, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';

import {
  useSupportTicketsWorkLogsCreateByKeyMutation,
  useSupportTicketsWorkLogsDestroyByKeyWorkLogIdMutation,
  useSupportTicketsWorkLogsPartialUpdateByKeyWorkLogIdMutation,
  useSupportTicketsWorkLogsRetrieveByKeyQuery,
  type TicketWorkLogRead,
} from '@/shared/api/generated/api';
import { InlineAlert, notify } from '@/shared/notifications';
import { apiErrorMessage } from '../attachments';

interface WorkLogValues {
  time_spent_minutes: number;
  started_at: Dayjs;
  description?: string;
}

const PAGE_SIZE = 10;

function isStaleEntry(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 412;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours && `${hours}h`, remainder && `${remainder}m`].filter(Boolean).join(' ');
}

export function TicketWorkLogs({ ticketKey, onChanged }: { ticketKey: string; onChanged: () => Promise<void> }) {
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ entry?: TicketWorkLogRead } | null>(null);
  const replay = useRef<{ body: string; key: string } | null>(null);
  const [form] = Form.useForm<WorkLogValues>();
  const { currentData, isFetching, isError, refetch } = useSupportTicketsWorkLogsRetrieveByKeyQuery({
    key: ticketKey,
    page,
    pageSize: PAGE_SIZE,
  }, { refetchOnMountOrArgChange: true });
  const [create, { isLoading: creating }] = useSupportTicketsWorkLogsCreateByKeyMutation();
  const [update, { isLoading: updating }] = useSupportTicketsWorkLogsPartialUpdateByKeyWorkLogIdMutation();
  const [remove, { isLoading: deleting }] = useSupportTicketsWorkLogsDestroyByKeyWorkLogIdMutation();
  const entries = currentData?.data ?? [];
  const count = currentData?.meta.pagination.count ?? 0;
  const busy = creating || updating || deleting;

  function openEditor(entry?: TicketWorkLogRead) {
    replay.current = null;
    form.resetFields();
    form.setFieldsValue({
      time_spent_minutes: entry?.time_spent_minutes,
      started_at: entry?.started_at ? dayjs(entry.started_at) : dayjs(),
      description: entry?.description ?? '',
    });
    setEditor({ entry });
  }

  async function refreshAfterWrite(nextPage: number) {
    if (nextPage === page) await refetch();
    else setPage(nextPage);
    await onChanged();
  }

  async function save(values: WorkLogValues) {
    if (!editor) return;
    const request = {
      time_spent_minutes: values.time_spent_minutes,
      started_at: values.started_at.toISOString(),
      description: values.description ?? '',
    };
    try {
      if (editor.entry) {
        await update({
          key: ticketKey,
          workLogId: editor.entry.id,
          'If-Match': editor.entry.etag,
          patchedWorkLogRequest: request,
        }).unwrap();
      } else {
        const body = JSON.stringify(request);
        if (replay.current?.body !== body) replay.current = { body, key: crypto.randomUUID() };
        await create({
          key: ticketKey,
          'Idempotency-Key': replay.current.key,
          workLogRequest: request,
        }).unwrap();
      }
    } catch (error) {
      if (isStaleEntry(error)) {
        void refetch();
        notify.error('Work log changed', { description: 'Close and reopen the editor to review the latest entry.' });
      } else {
        notify.error('Unable to save work log', { description: apiErrorMessage(error) });
      }
      return;
    }
    setEditor(null);
    await refreshAfterWrite(page);
  }

  async function deleteEntry(entry: TicketWorkLogRead) {
    try {
      await remove({ key: ticketKey, workLogId: entry.id, 'If-Match': entry.etag }).unwrap();
    } catch (error) {
      if (isStaleEntry(error)) void refetch();
      notify.error('Unable to delete work log', { description: apiErrorMessage(error) });
      return;
    }
    await refreshAfterWrite(entries.length === 1 && page > 1 ? page - 1 : page);
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <Button type="primary" onClick={() => openEditor()} disabled={busy}>Log work</Button>
      {isError ? (
        <InlineAlert variant="error" title="Unable to load work logs" onRetry={() => void refetch()} />
      ) : !currentData && isFetching ? (
        <Spin aria-label="Loading work logs" />
      ) : (
        <Spin spinning={isFetching}>
          <List
            dataSource={entries}
            rowKey="id"
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No work logged" /> }}
            renderItem={(entry) => (
              <List.Item
                actions={entry.can_manage ? [
                  <Button key="edit" type="link" disabled={busy} onClick={() => openEditor(entry)}>Edit</Button>,
                  <Popconfirm key="delete" title="Delete this work log?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => deleteEntry(entry)}>
                    <Button type="link" danger disabled={busy}>Delete</Button>
                  </Popconfirm>,
                ] : undefined}
              >
                <List.Item.Meta
                  title={`${formatDuration(entry.time_spent_minutes)} · ${entry.author.display_name}`}
                  description={
                    <>
                      <div>{new Date(entry.started_at).toLocaleString()}</div>
                      {entry.description && <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{entry.description}</Typography.Paragraph>}
                    </>
                  }
                />
              </List.Item>
            )}
          />
          {count > PAGE_SIZE && (
            <Pagination current={page} pageSize={PAGE_SIZE} total={count} onChange={setPage} showSizeChanger={false} />
          )}
        </Spin>
      )}
      <Modal
        title={editor?.entry ? 'Edit work log' : 'Log work'}
        okText={editor?.entry ? 'Save changes' : 'Log work'}
        open={editor !== null}
        onCancel={() => setEditor(null)}
        onOk={() => form.submit()}
        confirmLoading={creating || updating}
        closable={!busy}
        mask={{ closable: !busy }}
        cancelButtonProps={{ disabled: busy }}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={save} disabled={busy}>
          <Form.Item name="time_spent_minutes" label="Time spent (minutes)" rules={[
            { required: true, message: 'Enter the time spent.' },
            { type: 'integer', min: 1, max: 14400, message: 'Enter a whole number from 1 to 14,400.' },
          ]}>
            <InputNumber min={1} max={14400} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="started_at" label="Started at" rules={[{ required: true, message: 'Select a start time.' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description (optional)" extra="Everyone who can view this ticket can read this entry.">
            <Input.TextArea rows={3} maxLength={4000} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
