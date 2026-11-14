import { StatusBadge } from '@/shared/components/StatusBadge';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Descriptions, Empty, Form, Input, Select, Space, Spin, Timeline, Typography, message } from 'antd';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import {
  useSupportStatusesOptionsRetrieveQuery,
  useSupportTicketsActivityRetrieveByKeyQuery,
  useSupportTicketsAssignCreateByKeyMutation,
  useSupportTicketsCommentsCreateByKeyMutation,
  useSupportTicketsCommentsRetrieveByKeyQuery,
  useSupportTicketsRetrieveByKeyQuery,
  useSupportTicketsTransitionsCreateByKeyMutation,
  useUsersRetrieveQuery,
  type TicketActivityRead,
} from '@/shared/api/generated/api';

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : '–';

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = error.data;
    if (typeof data === 'object' && data !== null) {
      if ('detail' in data && typeof data.detail === 'string') return data.detail;
      if ('message' in data && typeof data.message === 'string') return data.message;
    }
  }
  return error instanceof Error ? error.message : 'Please try again.';
}

function isConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 409;
}

function activityLabel(activity: TicketActivityRead) {
  return activity.event_type.replaceAll('_', ' ');
}

export default function SupportTicketDetail() {
  const { key } = useParams<{ key: string }>();
  const { isCoordinator, permissionGroups } = useAuthState();
  const canManage = isCoordinator || Boolean(permissionGroups['support-agent'] || permissionGroups['support_agent']);
  const [comment, setComment] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | null>();
  const [statusId, setStatusId] = useState<number>();
  const [reason, setReason] = useState('');
  const ticketArg = { key: key ?? '' };
  const skip = !key;
  const { data: detail, isLoading, isError, refetch: refetchDetail } = useSupportTicketsRetrieveByKeyQuery(ticketArg, { skip });
  const { data: comments, refetch: refetchComments, isError: commentsError } = useSupportTicketsCommentsRetrieveByKeyQuery(ticketArg, { skip });
  const { data: activity, refetch: refetchActivity, isError: activityError } = useSupportTicketsActivityRetrieveByKeyQuery(ticketArg, { skip });
  const { data: statuses } = useSupportStatusesOptionsRetrieveQuery({ includeIds: detail?.data.status?.id ? [detail.data.status.id] : undefined }, { skip: !canManage || skip });
  const { data: users } = useUsersRetrieveQuery({}, { skip: !canManage || skip });
  const [postComment, { isLoading: posting }] = useSupportTicketsCommentsCreateByKeyMutation();
  const [assign, { isLoading: assigning }] = useSupportTicketsAssignCreateByKeyMutation();
  const [transition, { isLoading: transitioning }] = useSupportTicketsTransitionsCreateByKeyMutation();
  const ticket = detail?.data;

  const refresh = async () => {
    await Promise.all([refetchDetail(), refetchComments(), refetchActivity()]);
  };

  const submitComment = async () => {
    if (!key || !comment.trim()) return;
    try {
      await postComment({ key, commentCreateRequest: { body: comment.trim(), visibility: 'public' } }).unwrap();
      setComment('');
      await refresh();
      void message.success('Reply posted');
    } catch (error) {
      void message.error(errorMessage(error));
    }
  };

  const submitAssignment = async () => {
    if (!key || !ticket || assigneeId === undefined) return;
    try {
      await assign({ key, ticketAssignRequest: { assignee_id: assigneeId, version: ticket.version } }).unwrap();
      setAssigneeId(undefined);
      await refresh();
      void message.success('Assignment updated');
    } catch (error) {
      if (isConflict(error)) await refetchDetail();
      void message.error(errorMessage(error));
    }
  };

  const submitTransition = async () => {
    if (!key || !ticket || ticket.version === undefined || statusId === undefined) return;
    try {
      await transition({ key, ticketTransitionRequest: {
        to_status_id: statusId,
        version: ticket.version,
        reason: reason.trim() || undefined,
      } }).unwrap();
      setStatusId(undefined);
      setReason('');
      await refresh();
      void message.success('Status updated');
    } catch (error) {
      if (isConflict(error)) await refetchDetail();
      void message.error(errorMessage(error));
    }
  };

  if (!key) return <Alert type="error" message="Missing ticket key" />;
  if (isLoading) return <Spin size="large" />;
  if (isError || !ticket) return <Alert type="error" showIcon message="Ticket could not be loaded" action={<Button onClick={() => refetchDetail()}>Retry</Button>} />;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Link to="/support-tickets">← Back to support tickets</Link>
        <Card title={`${ticket.key} · ${ticket.subject}`} extra={<Button onClick={() => void refresh()}>Refresh</Button>}>
          <Descriptions column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Status"><StatusBadge status={ticket.status?.name} label={ticket.status?.name ?? '–'} /></Descriptions.Item>
            <Descriptions.Item label="Priority">{ticket.priority?.name ?? '–'}</Descriptions.Item>
            <Descriptions.Item label="Category">{ticket.category?.name ?? '–'}</Descriptions.Item>
            <Descriptions.Item label="Requester">{ticket.requester?.full_name || ticket.requester?.username || '–'}</Descriptions.Item>
            <Descriptions.Item label="Assignee">{ticket.assignee?.full_name || ticket.assignee?.username || 'Unassigned'}</Descriptions.Item>
            <Descriptions.Item label="Updated">{formatDate(ticket.updated_at)}</Descriptions.Item>
          </Descriptions>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{ticket.description}</Typography.Paragraph>
        </Card>

        {canManage && (
          <Card title="Manage ticket">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Select<number | null>
                  aria-label="Assign ticket"
                  style={{ minWidth: 240 }}
                  placeholder="Assign to user"
                  value={assigneeId}
                  onChange={setAssigneeId}
                  options={[
                    { value: null, label: 'Unassign' },
                    ...(ticket.assignee && !users?.data.some((user) => user.id === ticket.assignee.id)
                      ? [{ value: ticket.assignee.id, label: ticket.assignee.full_name || ticket.assignee.username }]
                      : []),
                    ...(users?.data ?? []).map((user) => ({ value: user.id, label: user.display_name || user.username })),
                  ]}
                />
                <Button loading={assigning} disabled={assigneeId === undefined} onClick={() => void submitAssignment()}>Update assignment</Button>
              </Space>
              <Typography.Text type="secondary">Status changes are validated by the server; only permitted transitions will succeed.</Typography.Text>
              <Space wrap>
                <Select
                  aria-label="Change ticket status"
                  style={{ minWidth: 240 }}
                  placeholder="Select new status"
                  value={statusId}
                  onChange={setStatusId}
                  options={(statuses?.data ?? []).filter((status) => status.id !== ticket.status?.id).map((status) => ({ value: status.id, label: status.name }))}
                />
                <Input aria-label="Transition reason" placeholder="Reason (optional)" value={reason} onChange={(event) => setReason(event.target.value)} style={{ width: 260 }} />
                <Button loading={transitioning} disabled={statusId === undefined || ticket.version === undefined} onClick={() => void submitTransition()}>Change status</Button>
              </Space>
              {ticket.version === undefined && <Alert type="warning" message="Status updates are unavailable until the server supplies a ticket version." />}
            </Space>
          </Card>
        )}

        <Card title="Conversation">
          {commentsError && <Alert type="error" showIcon message="Comments could not be loaded" action={<Button onClick={() => refetchComments()}>Retry</Button>} />}
          {!commentsError && (comments?.data.length ? comments.data.map((entry) => (
            <Card size="small" key={entry.id} style={{ marginBottom: 12 }}>
              <Space><strong>{entry.author?.full_name || entry.author?.username || 'User'}</strong><Typography.Text type="secondary">{formatDate(entry.created_at)}</Typography.Text></Space>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{entry.body}</Typography.Paragraph>
            </Card>
          )) : <Empty description="No replies yet" />)}
          <Form onFinish={() => void submitComment()} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label="Public reply"><Input.TextArea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a reply visible to the requester" /></Form.Item>
            <Button type="primary" htmlType="submit" disabled={!comment.trim()} loading={posting}>Post reply</Button>
          </Form>
        </Card>

        <Card title="Activity">
          {activityError ? <Alert type="error" showIcon message="Activity could not be loaded" action={<Button onClick={() => refetchActivity()}>Retry</Button>} /> :
            activity?.data.length ? <Timeline items={activity.data.map((event) => ({
              children: <span><strong>{event.actor_name}</strong> · {activityLabel(event)} <Typography.Text type="secondary">{formatDate(event.occurred_at)}</Typography.Text></span>,
            }))} /> : <Empty description="No activity yet" />}
        </Card>
      </Space>
    </div>
  );
}