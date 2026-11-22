import { StatusBadge } from '@/shared/components/StatusBadge';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Descriptions, Empty, Form, Input, Select, Space, Spin, Timeline, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { InlineAlert, notify } from '@/shared/notifications';
import { PaperClipOutlined } from '@ant-design/icons';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import {
  useSupportStatusesOptionsRetrieveQuery,
  useSupportTicketsActivityRetrieveByKeyQuery,
  useSupportTicketsActionsAssignCreateByKeyMutation,
  useSupportTicketsCommentsCreateByKeyMutation,
  useSupportTicketsCommentsRetrieveByKeyQuery,
  useSupportTicketsRetrieveByKeyQuery,
  useSupportTicketsActionsTransitionCreateByKeyMutation,
  useUsersRetrieveQuery,
  type TicketActivityRead,
} from '@/shared/api/generated/api';
import { userLabel } from '@/shared/utils/userRef';
import { useUploadSupportAttachmentMutation } from '../api';
import { SUPPORT_ATTACHMENT_ACCEPT, apiErrorMessage, toSupportAttachments } from '../attachments';
import { TicketAttachments } from '../components/TicketAttachments';
import { usePermission } from '@/features/auth/hooks/useCan';

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : '–';

const errorMessage = (error: unknown) => apiErrorMessage(error);

function isConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 409;
}

function activityLabel(activity: TicketActivityRead) {
  return activity.event_type.label;
}

const UNASSIGN = 0;

export default function SupportTicketDetail() {
  const { key } = useParams<{ key: string }>();
  const { id: currentUserId } = useAuthState();
  const canManage = usePermission('support.handle');
  const [comment, setComment] = useState('');
  const [replyFiles, setReplyFiles] = useState<UploadFile[]>([]);
  const [assigneeId, setAssigneeId] = useState<number | undefined>();  // 0 = unassign (antd select values cannot be null)
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
  const [uploadAttachment, { isLoading: uploadingReplyFiles }] = useUploadSupportAttachmentMutation();
  const [assign, { isLoading: assigning }] = useSupportTicketsActionsAssignCreateByKeyMutation();
  const [transition, { isLoading: transitioning }] = useSupportTicketsActionsTransitionCreateByKeyMutation();
  const ticket = detail?.data;

  const refresh = async () => {
    await Promise.all([refetchDetail(), refetchComments(), refetchActivity()]);
  };

  const submitComment = async () => {
    if (!key || !comment.trim()) return;
    try {
      const posted = await postComment({ key, commentCreateRequest: { body: comment.trim(), visibility: 'public' } }).unwrap();
      setComment('');
      const files = replyFiles.flatMap((entry) => (entry.originFileObj ? [entry.originFileObj] : []));
      const failed: string[] = [];
      for (const file of files) {
        try {
          await uploadAttachment({ key, file, commentId: posted.data.id }).unwrap();
        } catch (error) {
          failed.push(`${file.name}: ${errorMessage(error)}`);
        }
      }
      setReplyFiles([]);
      await refresh();
      if (failed.length) {
        notify.warning('Reply posted, but some files were not attached', {
          description: failed.join(' '),
          duration: 8000,
        });
      } else {
        notify.success(files.length ? 'Reply posted with attachments' : 'Reply posted');
      }
    } catch (error) {
      notify.error('Unable to post reply', {
        description: errorMessage(error),
      });
    }
  };

  const submitAssignment = async () => {
    if (!key || !ticket || assigneeId === undefined) return;
    try {
      await assign({ key, ticketAssignRequest: { assignee_id: assigneeId === UNASSIGN ? null : assigneeId, version: ticket.version } }).unwrap();
      setAssigneeId(undefined);
      await refresh();
      notify.success('Ticket assignment updated');
    } catch (error) {
      if (isConflict(error)) await refetchDetail();
      notify.error('Unable to update assignment', {
        description: errorMessage(error),
      });
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
      notify.success('Ticket status updated');
    } catch (error) {
      if (isConflict(error)) await refetchDetail();
      notify.error('Unable to update ticket status', {
        description: errorMessage(error),
      });
    }
  };

  if (!key) return <InlineAlert variant="error" title="Missing ticket key" />;
  if (isLoading) return <Spin size="large" />;
  if (isError || !ticket) {
    return (
      <InlineAlert
        variant="error"
        title="Unable to load support ticket"
        onRetry={() => void refetchDetail()}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Link to="/support-tickets">← Back to support tickets</Link>
        <Card title={`${ticket.key} · ${ticket.subject}`} extra={<Button onClick={() => void refresh()}>Refresh</Button>}>
          <Descriptions column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Status"><StatusBadge status={ticket.status?.name} label={ticket.status?.name ?? '–'} /></Descriptions.Item>
            <Descriptions.Item label="Priority">{ticket.priority?.name ?? '–'}</Descriptions.Item>
            <Descriptions.Item label="Category">{ticket.category?.name ?? '–'}</Descriptions.Item>
            <Descriptions.Item label="Requester">{userLabel(ticket.requester) || '–'}</Descriptions.Item>
            <Descriptions.Item label="Assignee">{userLabel(ticket.assignee) || 'Unassigned'}</Descriptions.Item>
            <Descriptions.Item label="Updated">{formatDate(ticket.updated_at)}</Descriptions.Item>
          </Descriptions>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{ticket.description}</Typography.Paragraph>
        </Card>

        {canManage && (
          <Card title="Manage ticket">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Select<number>
                  aria-label="Assign ticket"
                  style={{ minWidth: 240 }}
                  placeholder="Assign to user"
                  value={assigneeId}
                  onChange={setAssigneeId}
                  options={[
                    { value: UNASSIGN, label: 'Unassign' },
                    ...(ticket.assignee && !users?.data.some((user) => user.id === ticket.assignee?.id)
                      ? [{ value: ticket.assignee.id, label: userLabel(ticket.assignee) }]
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
              {ticket.version === undefined && (
                <InlineAlert
                  variant="warning"
                  compact
                  title="Status updates are temporarily unavailable"
                  description="Refresh the ticket to retrieve its latest version before making changes."
                />
              )}
            </Space>
          </Card>
        )}

        <Card title={`Attachments (${toSupportAttachments(ticket.attachments).length})`}>
          <TicketAttachments
            ticketKey={key}
            attachments={toSupportAttachments(ticket.attachments)}
            currentUserId={currentUserId}
            canManage={canManage}
            onChanged={refetchDetail}
          />
        </Card>

        <Card title="Conversation">
          {commentsError && (
            <InlineAlert
              variant="error"
              title="Unable to load conversation"
              onRetry={() => void refetchComments()}
            />
          )}
          {!commentsError && (comments?.data.length ? comments.data.map((entry) => (
            <Card size="small" key={entry.id} style={{ marginBottom: 12 }}>
              <Space><strong>{userLabel(entry.author) || 'User'}</strong><Typography.Text type="secondary">{formatDate(entry.created_at)}</Typography.Text></Space>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{entry.body}</Typography.Paragraph>
            </Card>
          )) : <Empty description="No replies yet" />)}
          <Form onFinish={() => void submitComment()} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label="Public reply"><Input.TextArea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a reply visible to the requester" /></Form.Item>
            <Form.Item>
              <Upload
                multiple
                accept={SUPPORT_ATTACHMENT_ACCEPT}
                fileList={replyFiles}
                beforeUpload={() => false}
                onChange={({ fileList }) => setReplyFiles(fileList)}
              >
                <Button icon={<PaperClipOutlined />}>Attach files to reply</Button>
              </Upload>
            </Form.Item>
            <Button type="primary" htmlType="submit" disabled={!comment.trim()} loading={posting || uploadingReplyFiles}>Post reply</Button>
          </Form>
        </Card>

        <Card title="Activity">
          {activityError ? (
            <InlineAlert
              variant="error"
              title="Unable to load ticket activity"
              onRetry={() => void refetchActivity()}
            />
          ) :
            activity?.data.length ? <Timeline items={activity.data.map((event) => ({
              children: <span><strong>{event.actor_name}</strong> · {activityLabel(event)} <Typography.Text type="secondary">{formatDate(event.occurred_at)}</Typography.Text></span>,
            }))} /> : <Empty description="No activity yet" />}
        </Card>
      </Space>
    </div>
  );
}