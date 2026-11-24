import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Spin,
  Tabs,
  Timeline,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  CommentOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  SendOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { usePermission } from '@/features/auth/hooks/useCan';
import {
  useSupportCannedResponsesRetrieveQuery,
  useSupportCategoriesOptionsRetrieveQuery,
  useSupportPrioritiesOptionsRetrieveQuery,
  useSupportStatusesOptionsRetrieveQuery,
  useSupportTeamsOptionsRetrieveQuery,
  useSupportTicketsActionsAssignCreateByKeyMutation,
  useSupportTicketsActionsTransitionCreateByKeyMutation,
  useSupportTicketsActivityRetrieveByKeyQuery,
  useSupportTicketsCommentsCreateByKeyMutation,
  useSupportTicketsCommentsDestroyByKeyCommentIdMutation,
  useSupportTicketsCommentsPartialUpdateByKeyCommentIdMutation,
  useSupportTicketsCommentsRetrieveByKeyQuery,
  useSupportTicketsPartialUpdateByKeyMutation,
  useSupportTicketsRetrieveByKeyQuery,
  useSupportTicketsWatchersCreateByKeyMutation,
  useUsersRetrieveQuery,
  type PatchedTicketUpdateRequest,
  type ResolutionCodeEnum,
  type TicketActivityRead,
  type TicketTypeEnum,
  type UrgencyEnum,
  type VisibilityEnum,
} from '@/shared/api/generated/api';
import { InlineAlert, notify } from '@/shared/notifications';
import { userLabel } from '@/shared/utils/userRef';
import {
  useRemoveSupportWatcherMutation,
  useUploadSupportAttachmentMutation,
} from '../api';
import {
  SUPPORT_ATTACHMENT_ACCEPT,
  apiErrorMessage,
  toSupportAttachments,
} from '../attachments';
import { TicketWorkLogs } from '../components/TicketWorkLogs';
import { TicketAttachments } from '../components/TicketAttachments';
import {
  TicketPriorityBadge,
  TicketSlaBadge,
  TicketStatusBadge,
  TicketTypeBadge,
  TicketUserChip,
} from '../components/TicketBadges';
import styles from '../components/SupportTickets.module.css';
import {
  IMPACT_URGENCY_OPTIONS,
  RESOLUTION_CODE_OPTIONS,
  TICKET_TYPE_OPTIONS,
  formatTicketActivityLines,
  getTicketStatusMeta,
  getTransitionRequirements,
} from '../ticketPresentation';

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '–';

const errorMessage = (error: unknown) => apiErrorMessage(error);

function isConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 409
  );
}

function activityLabel(activity: TicketActivityRead) {
  return activity.event_type.label;
}

const UNASSIGN = 0;

interface PendingTransitionState {
  statusId: number;
  statusName: string;
  requiresResolution: boolean;
  requiresReason: boolean;
  isReopen: boolean;
}

export default function SupportTicketDetail() {
  const { state } = useLocation();
  const queueSearch = typeof state?.queueSearch === 'string' ? state.queueSearch : '';
  const { key } = useParams<{ key: string }>();
  const { id: currentUserId } = useAuthState();
  const canManage = usePermission('support.handle');

  // Conversation composer state
  const [comment, setComment] = useState('');
  const [replyVisibility, setReplyVisibility] = useState<VisibilityEnum>('public');
  const [replyFiles, setReplyFiles] = useState<UploadFile[]>([]);

  // Inline comment edit state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState('');

  // Inline Subject & Description & Labels edit state
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isEditingLabels, setIsEditingLabels] = useState(false);
  const [labelsDraft, setLabelsDraft] = useState<string[]>([]);
  const [isEditingExtRef, setIsEditingExtRef] = useState(false);
  const [extRefDraft, setExtRefDraft] = useState('');

  // Status Transition Modal state (only opened when reason or resolution summary is required, or on manual note)
  const [pendingTransition, setPendingTransition] =
    useState<PendingTransitionState | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [resolutionCode, setResolutionCode] = useState<ResolutionCodeEnum>('fixed');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [rootCause, setRootCause] = useState('');

  const [activeTab, setActiveTab] = useState<string>('conversation');
  const [savingField, setSavingField] = useState<string | null>(null);

  const ticketArg = { key: key ?? '' };
  const skip = !key;

  const {
    data: detail,
    isLoading,
    isError,
    refetch: refetchDetail,
  } = useSupportTicketsRetrieveByKeyQuery(ticketArg, { skip });
  const {
    data: comments,
    refetch: refetchComments,
    isError: commentsError,
  } = useSupportTicketsCommentsRetrieveByKeyQuery(ticketArg, { skip });
  const {
    data: activity,
    refetch: refetchActivity,
    isError: activityError,
  } = useSupportTicketsActivityRetrieveByKeyQuery(ticketArg, { skip });

  const ticket = detail?.data;
  const isRequester = Boolean(
    currentUserId && ticket?.requester?.id === currentUserId,
  );
  const canEditCoreFields = canManage || isRequester;

  const { data: statuses } = useSupportStatusesOptionsRetrieveQuery(
    {
      includeIds: ticket?.status?.id ? [ticket.status.id] : undefined,
    },
    { skip: (!canManage && !isRequester) || skip },
  );
  const { data: categories } = useSupportCategoriesOptionsRetrieveQuery(
    {
      includeIds: ticket?.category?.id ? [ticket.category.id] : undefined,
    },
    { skip: !canManage || skip },
  );
  const { data: priorities } = useSupportPrioritiesOptionsRetrieveQuery(
    {
      includeIds: ticket?.priority?.id ? [ticket.priority.id] : undefined,
    },
    { skip: !canManage || skip },
  );
  const { data: teams } = useSupportTeamsOptionsRetrieveQuery(
    {
      includeIds: ticket?.team?.id ? [ticket.team.id] : undefined,
    },
    { skip: !canManage || skip },
  );
  const { data: users } = useUsersRetrieveQuery(
    {},
    { skip: !canManage || skip },
  );
  const { data: cannedResponses } = useSupportCannedResponsesRetrieveQuery(
    undefined,
    { skip: !canManage || skip },
  );

  const [updateTicket, { isLoading: updatingTicket }] =
    useSupportTicketsPartialUpdateByKeyMutation();
  const [postComment, { isLoading: posting }] =
    useSupportTicketsCommentsCreateByKeyMutation();
  const [updateComment, { isLoading: updatingComment }] =
    useSupportTicketsCommentsPartialUpdateByKeyCommentIdMutation();
  const [deleteComment] =
    useSupportTicketsCommentsDestroyByKeyCommentIdMutation();
  const [uploadAttachment, { isLoading: uploadingReplyFiles }] =
    useUploadSupportAttachmentMutation();
  const [assign, { isLoading: assigning }] =
    useSupportTicketsActionsAssignCreateByKeyMutation();
  const [transition, { isLoading: transitioning }] =
    useSupportTicketsActionsTransitionCreateByKeyMutation();
  const [addWatcher, { isLoading: addingWatcher }] =
    useSupportTicketsWatchersCreateByKeyMutation();
  const [removeWatcher, { isLoading: removingWatcher }] =
    useRemoveSupportWatcherMutation();

  const refresh = async () => {
    await Promise.all([refetchDetail(), refetchComments(), refetchActivity()]);
  };

  // --- Direct / Instant Field Update Handler ---
  const handleFieldPatch = async (
    fieldName: string,
    patch: Omit<PatchedTicketUpdateRequest, 'version'>,
    successMessage?: string,
  ) => {
    if (!key || !ticket || ticket.version === undefined) return false;
    setSavingField(fieldName);
    try {
      await updateTicket({
        key,
        patchedTicketUpdateRequest: {
          ...patch,
          version: ticket.version,
        },
      }).unwrap();
      await Promise.all([refetchDetail(), refetchActivity()]);
      if (successMessage) {
        notify.success(successMessage);
      }
      return true;
    } catch (error) {
      if (isConflict(error)) await refetchDetail();
      notify.error(`Unable to update ${fieldName}`, {
        description: errorMessage(error),
      });
      return false;
    } finally {
      setSavingField(null);
    }
  };

  // --- Direct / Instant Assignment Handler ---
  const handleDirectAssign = async (targetAssigneeId: number | null) => {
    if (!key || !ticket) return;
    if ((ticket.assignee?.id ?? null) === targetAssigneeId) return;
    setSavingField('assignee');
    try {
      await assign({
        key,
        ticketAssignRequest: {
          assignee_id: targetAssigneeId,
          version: ticket.version,
        },
      }).unwrap();
      await Promise.all([refetchDetail(), refetchActivity()]);
      notify.success(
        targetAssigneeId === null
          ? 'Ticket unassigned'
          : targetAssigneeId === currentUserId
            ? 'Assigned to you'
            : 'Ticket assignee updated',
      );
    } catch (error) {
      if (isConflict(error)) await refetchDetail();
      notify.error('Unable to update assignment', {
        description: errorMessage(error),
      });
    } finally {
      setSavingField(null);
    }
  };

  // --- Smart Status Transition Handler ---
  const executeTransition = async (params: {
    toStatusId: number;
    toStatusName: string;
    reason?: string;
    resolutionSummary?: string;
    resolutionCode?: ResolutionCodeEnum;
    rootCause?: string;
  }) => {
    if (!key || !ticket || ticket.version === undefined) return;
    setSavingField('status');
    try {
      await transition({
        key,
        ticketTransitionRequest: {
          to_status_id: params.toStatusId,
          version: ticket.version,
          reason: params.reason?.trim() || undefined,
          resolution_summary: params.resolutionSummary?.trim() || undefined,
          resolution_code: params.resolutionCode || undefined,
          root_cause: params.rootCause?.trim() || undefined,
        },
      }).unwrap();
      setPendingTransition(null);
      setTransitionReason('');
      setResolutionSummary('');
      setRootCause('');
      await refresh();
      notify.success(`Status updated to ${params.toStatusName}`);
    } catch (error) {
      if (isConflict(error)) await refetchDetail();
      // If server demands a reason or resolution summary for a custom admin-configured transition, open the modal automatically
      const msg = errorMessage(error);
      if (
        !pendingTransition &&
        (msg.toLowerCase().includes('reason') ||
          msg.toLowerCase().includes('resolution'))
      ) {
        const needsRes = msg.toLowerCase().includes('resolution');
        setPendingTransition({
          statusId: params.toStatusId,
          statusName: params.toStatusName,
          requiresResolution: needsRes,
          requiresReason: !needsRes,
          isReopen: false,
        });
        return;
      }
      notify.error('Unable to update ticket status', {
        description: msg,
      });
    } finally {
      setSavingField(null);
    }
  };

  const initiateStatusTransition = (targetStatusId: number) => {
    if (!ticket || targetStatusId === ticket.status?.id) return;
    const targetOption = (statuses?.data ?? []).find(
      (s) => s.id === targetStatusId,
    );
    const targetName = targetOption?.name ?? 'New Status';
    const reqs = getTransitionRequirements(targetName, ticket.status?.name);

    if (reqs.requiresResolution || reqs.requiresReason) {
      setTransitionReason('');
      setResolutionSummary(ticket.resolution_summary || '');
      setRootCause(ticket.root_cause || '');
      setResolutionCode(
        (ticket.resolution_code as ResolutionCodeEnum) || 'fixed',
      );
      setPendingTransition({
        statusId: targetStatusId,
        statusName: targetName,
        requiresResolution: reqs.requiresResolution,
        requiresReason: reqs.requiresReason,
        isReopen: reqs.isReopen,
      });
      return;
    }

    void executeTransition({
      toStatusId: targetStatusId,
      toStatusName: targetName,
    });
  };

  // --- Watchers Management Handlers ---
  const handleToggleWatch = async () => {
    if (!key || !ticket) return;
    try {
      if (ticket.is_watching) {
        await removeWatcher({ key }).unwrap();
        notify.success('Stopped watching ticket');
      } else {
        await addWatcher({ key, watcherRequest: {} }).unwrap();
        notify.success('Watching ticket for updates');
      }
      await Promise.all([refetchDetail(), refetchActivity()]);
    } catch (error) {
      notify.error('Unable to update watcher preference', {
        description: errorMessage(error),
      });
    }
  };

  const handleAddWatcher = async (userId: number) => {
    if (!key || !ticket) return;
    try {
      await addWatcher({ key, watcherRequest: { user_id: userId } }).unwrap();
      await Promise.all([refetchDetail(), refetchActivity()]);
      notify.success('Watcher added');
    } catch (error) {
      notify.error('Unable to add watcher', {
        description: errorMessage(error),
      });
    }
  };

  const handleRemoveWatcher = async (userId: number, displayName?: string) => {
    if (!key || !ticket) return;
    try {
      await removeWatcher({ key, userId }).unwrap();
      await Promise.all([refetchDetail(), refetchActivity()]);
      notify.success(
        displayName ? `Removed ${displayName} from watchers` : 'Watcher removed',
      );
    } catch (error) {
      notify.error('Unable to remove watcher', {
        description: errorMessage(error),
      });
    }
  };

  // --- Reply & Internal Note Submission ---
  const submitComment = async () => {
    if (!key || !comment.trim()) return;
    const effectiveVisibility: VisibilityEnum = canManage
      ? replyVisibility
      : 'public';
    try {
      const posted = await postComment({
        key,
        commentCreateRequest: {
          body: comment.trim(),
          visibility: effectiveVisibility,
        },
      }).unwrap();
      setComment('');
      const files = replyFiles.flatMap((entry) =>
        entry.originFileObj ? [entry.originFileObj] : [],
      );
      const failed: string[] = [];
      for (const file of files) {
        try {
          await uploadAttachment({
            key,
            file,
            commentId: posted.data.id,
            isRestricted: effectiveVisibility === 'internal',
          }).unwrap();
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
        notify.success(
          effectiveVisibility === 'internal'
            ? 'Internal note added'
            : files.length
              ? 'Reply posted with attachments'
              : 'Reply posted',
        );
      }
    } catch (error) {
      notify.error('Unable to post reply', {
        description: errorMessage(error),
      });
    }
  };

  const handleSaveCommentEdit = async (commentId: number) => {
    if (!key || !editingCommentBody.trim()) return;
    try {
      await updateComment({
        key,
        commentId,
        patchedCommentUpdateRequest: { body: editingCommentBody.trim() },
      }).unwrap();
      setEditingCommentId(null);
      setEditingCommentBody('');
      await refetchComments();
      notify.success('Comment updated');
    } catch (error) {
      notify.error('Unable to update comment', {
        description: errorMessage(error),
      });
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!key) return;
    try {
      await deleteComment({ key, commentId }).unwrap();
      await Promise.all([refetchComments(), refetchActivity()]);
      notify.success('Comment removed');
    } catch (error) {
      notify.error('Unable to delete comment', {
        description: errorMessage(error),
      });
    }
  };

  // Build available status transition buttons for the header bar
  const workflowTransitions = useMemo(() => {
    if (!ticket || !statuses?.data) return [];
    const currentMeta = getTicketStatusMeta(ticket.status);
    const otherStatuses = statuses.data.filter(
      (s) => s.id !== ticket.status?.id,
    );

    if (!canManage) {
      // Requesters can only reopen a resolved ticket
      if (currentMeta.variant === 'resolved') {
        return otherStatuses
          .filter((s) => getTicketStatusMeta(s.name).variant === 'open')
          .map((s) => ({
            ...s,
            reqs: getTransitionRequirements(s.name, ticket.status?.name),
          }));
      }
      return [];
    }

    // Filter out invalid transitions from DEFAULT_TRANSITIONS
    return otherStatuses
      .filter((s) => {
        const targetVariant = getTicketStatusMeta(s.name).variant;
        if (currentMeta.variant === 'closed') return false;
        if (
          currentMeta.variant === 'resolved' &&
          targetVariant !== 'open' &&
          targetVariant !== 'closed'
        ) {
          return false;
        }
        if (
          currentMeta.variant === 'in_progress' &&
          targetVariant === 'open'
        ) {
          return false;
        }
        if (currentMeta.variant === 'waiting' && targetVariant === 'open') {
          return false;
        }
        return true;
      })
      .map((s) => ({
        ...s,
        reqs: getTransitionRequirements(s.name, ticket.status?.name),
      }));
  }, [ticket, statuses, canManage]);

  const assigneeOptions = useMemo(() => {
    if (!ticket) return [];
    const list: { value: number; label: string }[] = [
      { value: UNASSIGN, label: 'Unassigned' },
    ];
    const seen = new Set<number>();
    if (ticket.assignee?.id) {
      seen.add(ticket.assignee.id);
      list.push({
        value: ticket.assignee.id,
        label: userLabel(ticket.assignee) || ticket.assignee.username,
      });
    }
    for (const user of users?.data ?? []) {
      if (!seen.has(user.id)) {
        seen.add(user.id);
        list.push({
          value: user.id,
          label: user.display_name || user.username,
        });
      }
    }
    return list;
  }, [ticket, users]);

  const watcherCandidateOptions = useMemo(() => {
    if (!ticket) return [];
    const existingIds = new Set(
      (ticket.watchers ?? []).map((w) => w.user.id),
    );
    return (users?.data ?? [])
      .filter((u) => !existingIds.has(u.id))
      .map((u) => ({
        value: u.id,
        label: u.display_name || u.username,
      }));
  }, [ticket, users]);

  const userDirectoryByUsername = useMemo(() => {
    const map = new Map<
      string,
      {
        id?: number;
        username?: string | null;
        display_name?: string | null;
        avatar_url?: string | null;
      }
    >();
    const register = (
      entry:
        | {
            id?: number;
            username?: string | null;
            display_name?: string | null;
            avatar_url?: string | null;
          }
        | null
        | undefined,
    ) => {
      if (!entry) return;
      const uname = entry.username?.trim().toLowerCase();
      const dname = entry.display_name?.trim().toLowerCase();
      const existing = uname ? map.get(uname) : undefined;
      const merged = {
        id: entry.id ?? existing?.id,
        username: entry.username ?? existing?.username,
        display_name: entry.display_name || existing?.display_name,
        avatar_url: entry.avatar_url ?? existing?.avatar_url,
      };
      if (uname) map.set(uname, merged);
      if (dname) map.set(dname, merged);
    };

    for (const u of users?.data ?? []) register(u);
    if (ticket) {
      register(ticket.requester);
      register(ticket.created_by);
      register(ticket.assignee);
      register(ticket.resolved_by);
      for (const w of ticket.watchers ?? []) register(w.user);
    }
    for (const c of comments?.data ?? []) register(c.author);
    return map;
  }, [users, ticket, comments]);

  if (!key) return <InlineAlert variant="error" title="Missing ticket key" />;
  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (isError || !ticket) {
    return (
      <InlineAlert
        variant="error"
        title="Unable to load support ticket"
        onRetry={() => void refetchDetail()}
      />
    );
  }

  const attachmentsList = toSupportAttachments(ticket.attachments);
  const commentsList = comments?.data ?? [];
  const activityList = activity?.data ?? [];
  const currentStatusMeta = getTicketStatusMeta(ticket.status);

  return (
    <div className={styles.workspacePage}>
      {/* Top Breadcrumb & Utility Bar */}
      <div className={styles.topBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to={{ pathname: '/support-tickets', search: queueSearch }} className={styles.backLink}>
            <ArrowLeftOutlined />
            <span>Support queue</span>
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbKey}>{ticket.key}</span>
        </nav>

        <Space size={8} wrap>
          <Button
            size="small"
            icon={
              ticket.is_watching ? <EyeInvisibleOutlined /> : <EyeOutlined />
            }
            loading={addingWatcher || removingWatcher}
            onClick={() => void handleToggleWatch()}
          >
            {ticket.is_watching ? 'Unwatch' : 'Watch'}{' '}
            {ticket.watchers?.length ? `(${ticket.watchers.length})` : ''}
          </Button>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              void navigator.clipboard?.writeText(ticket.key);
              notify.success('Copied ticket key', { description: ticket.key });
            }}
          >
            Copy key
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Hero Header Card */}
      <section className={styles.headerCard} aria-label="Ticket overview">
        <div className={styles.headerBadgesRow}>
          <div className={styles.badgeGroup}>
            <span className={styles.ticketKeyPill}>{ticket.key}</span>
            <TicketStatusBadge status={ticket.status} />
            {ticket.priority && (
              <TicketPriorityBadge priority={ticket.priority} />
            )}
            <TicketTypeBadge ticketType={ticket.ticket_type} />
            <TicketSlaBadge sla={ticket.sla} status={ticket.status} />
          </div>

          {/* 1-Click Quick Status Transition Buttons */}
          {workflowTransitions.length > 0 && (
            <div className={styles.workflowActions}>
              {workflowTransitions.map((item) => (
                <Button
                  key={item.id}
                  size="small"
                  type={
                    item.reqs.buttonVariant === 'primary' ||
                    item.reqs.buttonVariant === 'resolve'
                      ? 'primary'
                      : 'default'
                  }
                  loading={transitioning && savingField === 'status'}
                  disabled={ticket.version === undefined}
                  onClick={() => initiateStatusTransition(item.id)}
                >
                  {item.reqs.actionLabel}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Subject with Inline Edit */}
        <div className={styles.titleRow}>
          {isEditingSubject ? (
            <div className={styles.titleEditBox}>
              <Input
                aria-label="Edit ticket subject"
                value={subjectDraft}
                maxLength={200}
                onChange={(e) => setSubjectDraft(e.target.value)}
                onPressEnter={() => {
                  const trimmed = subjectDraft.trim();
                  if (!trimmed) return;
                  void handleFieldPatch(
                    'subject',
                    { subject: trimmed },
                    'Subject updated',
                  ).then((ok) => {
                    if (ok) setIsEditingSubject(false);
                  });
                }}
              />
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={updatingTicket && savingField === 'subject'}
                disabled={!subjectDraft.trim()}
                onClick={() => {
                  void handleFieldPatch(
                    'subject',
                    { subject: subjectDraft.trim() },
                    'Subject updated',
                  ).then((ok) => {
                    if (ok) setIsEditingSubject(false);
                  });
                }}
              >
                Save
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setIsEditingSubject(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <h1 className={styles.ticketTitle}>{ticket.subject}</h1>
              {canEditCoreFields && (
                <Tooltip title="Edit subject">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    aria-label="Edit subject"
                    onClick={() => {
                      setSubjectDraft(ticket.subject);
                      setIsEditingSubject(true);
                    }}
                  />
                </Tooltip>
              )}
            </>
          )}
        </div>

        {/* Metadata Summary Bar */}
        <div className={styles.headerMetaBar}>
          <div className={styles.metaFacts}>
            <span className={styles.metaFactItem}>
              <span>Requester:</span>
              <TicketUserChip user={ticket.requester} />
            </span>
            <span>·</span>
            <span>Opened {formatDate(ticket.created_at)}</span>
            {ticket.source?.label && (
              <>
                <span>·</span>
                <span>Via {ticket.source.label}</span>
              </>
            )}
            {ticket.reopen_count ? (
              <>
                <span>·</span>
                <span>Reopened {ticket.reopen_count}×</span>
              </>
            ) : null}
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Last updated {formatDate(ticket.updated_at)}
          </Typography.Text>
        </div>
      </section>

      {/* Main 2-Column Workspace */}
      <div className={styles.workspaceGrid}>
        {/* Left Main Column */}
        <div className={styles.mainColumn}>
          {/* Resolution Banner (shown when ticket has resolution summary or code) */}
          {(ticket.resolution_summary || ticket.resolution_code) && (
            <section
              className={styles.resolutionBanner}
              aria-label="Ticket resolution"
            >
              <div className={styles.resolutionHeader}>
                <span className={styles.resolutionTitle}>
                  <CheckCircleOutlined />
                  <span>
                    Resolution
                    {ticket.resolution_code
                      ? ` · ${ticket.resolution_code.replaceAll('_', ' ')}`
                      : ''}
                  </span>
                </span>
                {ticket.resolved_at && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Resolved {formatDate(ticket.resolved_at)}
                    {ticket.resolved_by
                      ? ` by ${userLabel(ticket.resolved_by)}`
                      : ''}
                  </Typography.Text>
                )}
              </div>
              {ticket.resolution_summary && (
                <p className={styles.resolutionSummary}>
                  {ticket.resolution_summary}
                </p>
              )}
              {ticket.root_cause && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  <strong>Root cause:</strong> {ticket.root_cause}
                </Typography.Text>
              )}
            </section>
          )}

          {/* Description & Labels Card */}
          <section className={styles.panelCard} aria-label="Ticket description">
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Description</h2>
              {canEditCoreFields && !isEditingDescription && (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDescriptionDraft(ticket.description);
                    setIsEditingDescription(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </header>
            <div className={styles.panelBody}>
              {isEditingDescription ? (
                <Space
                  direction="vertical"
                  size={10}
                  style={{ width: '100%' }}
                >
                  <Input.TextArea
                    aria-label="Edit ticket description"
                    rows={6}
                    maxLength={10000}
                    showCount
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                  />
                  <Space>
                    <Button
                      type="primary"
                      size="small"
                      loading={
                        updatingTicket && savingField === 'description'
                      }
                      disabled={!descriptionDraft.trim()}
                      onClick={() => {
                        void handleFieldPatch(
                          'description',
                          { description: descriptionDraft.trim() },
                          'Description updated',
                        ).then((ok) => {
                          if (ok) setIsEditingDescription(false);
                        });
                      }}
                    >
                      Save description
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setIsEditingDescription(false)}
                    >
                      Cancel
                    </Button>
                  </Space>
                </Space>
              ) : (
                <p className={styles.descriptionText}>
                  {ticket.description || 'No description provided.'}
                </p>
              )}

              {/* Labels Bar */}
              <div className={styles.labelsSection}>
                <TagOutlined
                  style={{ color: 'var(--lm-text-tertiary)', fontSize: 13 }}
                />
                {isEditingLabels ? (
                  <Space wrap style={{ flex: 1 }}>
                    <Select
                      mode="tags"
                      size="small"
                      aria-label="Edit ticket labels"
                      style={{ minWidth: 240 }}
                      tokenSeparators={[',']}
                      value={labelsDraft}
                      onChange={setLabelsDraft}
                      placeholder="Add labels (e.g. calibration, network)"
                    />
                    <Button
                      type="primary"
                      size="small"
                      loading={updatingTicket && savingField === 'labels'}
                      onClick={() => {
                        void handleFieldPatch(
                          'labels',
                          {
                            labels: labelsDraft
                              .map((l) => l.trim())
                              .filter(Boolean),
                          },
                          'Labels updated',
                        ).then((ok) => {
                          if (ok) setIsEditingLabels(false);
                        });
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setIsEditingLabels(false)}
                    >
                      Cancel
                    </Button>
                  </Space>
                ) : (
                  <>
                    {ticket.labels?.length ? (
                      ticket.labels.map((label) => (
                        <span key={label} className={styles.labelPill}>
                          {label}
                        </span>
                      ))
                    ) : (
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        No labels
                      </Typography.Text>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => {
                          setLabelsDraft(ticket.labels ?? []);
                          setIsEditingLabels(true);
                        }}
                      >
                        {ticket.labels?.length ? 'Edit labels' : '+ Add labels'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Unified Conversation, Attachments & Activity Tabs */}
          <section
            className={styles.panelCard}
            aria-label="Ticket collaboration and history"
          >
            <div style={{ padding: '4px 18px 18px' }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'conversation',
                    label: (
                      <Space size={6}>
                        <CommentOutlined />
                        <span>Conversation ({commentsList.length})</span>
                      </Space>
                    ),
                    children: (
                      <div>
                        {/* Reply & Internal Note Composer */}
                        <div
                          className={`${styles.composerBox} ${
                            canManage && replyVisibility === 'internal'
                              ? styles.composerInternal
                              : ''
                          }`}
                        >
                          <div className={styles.composerToolbar}>
                            {canManage ? (
                              <Segmented<VisibilityEnum>
                                size="small"
                                aria-label="Reply visibility"
                                value={replyVisibility}
                                onChange={setReplyVisibility}
                                options={[
                                  {
                                    value: 'public',
                                    label: 'Public reply (visible to requester)',
                                  },
                                  {
                                    value: 'internal',
                                    label: 'Internal note (staff only)',
                                  },
                                ]}
                              />
                            ) : (
                              <Typography.Text
                                strong
                                style={{ fontSize: 12.5 }}
                              >
                                Reply to support
                              </Typography.Text>
                            )}

                            {canManage &&
                              (cannedResponses?.data?.length ?? 0) > 0 && (
                                <Select
                                  size="small"
                                  aria-label="Insert canned response"
                                  placeholder="Insert canned response…"
                                  style={{ width: 210 }}
                                  value={null}
                                  onChange={(bodyText: string) => {
                                    setComment((prev) =>
                                      prev
                                        ? `${prev}\n\n${bodyText}`
                                        : bodyText,
                                    );
                                  }}
                                  options={(cannedResponses?.data ?? []).map(
                                    (item) => ({
                                      value: item.body,
                                      label: item.title,
                                    }),
                                  )}
                                />
                              )}
                          </div>

                          <Input.TextArea
                            rows={4}
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            onKeyDown={(event) => {
                              if (
                                (event.metaKey || event.ctrlKey) &&
                                event.key === 'Enter' &&
                                comment.trim()
                              ) {
                                event.preventDefault();
                                void submitComment();
                              }
                            }}
                            placeholder={
                              canManage && replyVisibility === 'internal'
                                ? 'Write a private internal note visible only to support agents and administrators…'
                                : 'Write a reply visible to the requester… (Ctrl+Enter to send)'
                            }
                          />

                          <div className={styles.composerFooter}>
                            <Upload
                              multiple
                              accept={SUPPORT_ATTACHMENT_ACCEPT}
                              fileList={replyFiles}
                              beforeUpload={() => false}
                              onChange={({ fileList }) =>
                                setReplyFiles(fileList)
                              }
                            >
                              <Button
                                size="small"
                                icon={<PaperClipOutlined />}
                              >
                                Attach files
                              </Button>
                            </Upload>

                            <Button
                              type="primary"
                              icon={
                                canManage && replyVisibility === 'internal' ? (
                                  <LockOutlined />
                                ) : (
                                  <SendOutlined />
                                )
                              }
                              disabled={!comment.trim()}
                              loading={posting || uploadingReplyFiles}
                              onClick={() => void submitComment()}
                            >
                              {canManage && replyVisibility === 'internal'
                                ? 'Add internal note'
                                : 'Post reply'}
                            </Button>
                          </div>
                        </div>

                        {commentsError && (
                          <InlineAlert
                            variant="error"
                            title="Unable to load conversation"
                            onRetry={() => void refetchComments()}
                          />
                        )}

                        {!commentsError &&
                          (commentsList.length ? (
                            <div className={styles.commentList}>
                              {commentsList.map((entry) => {
                                const isInternal =
                                  entry.visibility?.value === 'internal';
                                const canModifyComment =
                                  canManage ||
                                  (currentUserId !== null &&
                                    entry.author?.id === currentUserId);
                                const isEditingThis =
                                  editingCommentId === entry.id;

                                return (
                                  <article
                                    key={entry.id}
                                    className={`${styles.commentItem} ${
                                      isInternal
                                        ? styles.commentItemInternal
                                        : ''
                                    }`}
                                  >
                                    <div className={styles.commentHeader}>
                                      <div
                                        className={styles.commentAuthorGroup}
                                      >
                                        <TicketUserChip user={entry.author} />
                                        {isInternal && (
                                          <span
                                            className={styles.internalBadge}
                                          >
                                            <LockOutlined />
                                            <span>Internal note</span>
                                          </span>
                                        )}
                                        <Typography.Text
                                          type="secondary"
                                          style={{ fontSize: 12 }}
                                        >
                                          {formatDate(entry.created_at)}
                                          {entry.edited_at ? ' (edited)' : ''}
                                        </Typography.Text>
                                      </div>

                                      {canModifyComment && !isEditingThis && (
                                        <Space size={2}>
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            aria-label="Edit comment"
                                            onClick={() => {
                                              setEditingCommentId(entry.id);
                                              setEditingCommentBody(entry.body);
                                            }}
                                          />
                                          <Popconfirm
                                            title="Delete this comment?"
                                            okText="Delete"
                                            okButtonProps={{ danger: true }}
                                            onConfirm={() =>
                                              void handleDeleteComment(entry.id)
                                            }
                                          >
                                            <Button
                                              type="text"
                                              size="small"
                                              danger
                                              icon={<DeleteOutlined />}
                                              aria-label="Delete comment"
                                            />
                                          </Popconfirm>
                                        </Space>
                                      )}
                                    </div>

                                    {isEditingThis ? (
                                      <Space
                                        direction="vertical"
                                        size={8}
                                        style={{ width: '100%' }}
                                      >
                                        <Input.TextArea
                                          rows={3}
                                          value={editingCommentBody}
                                          onChange={(e) =>
                                            setEditingCommentBody(
                                              e.target.value,
                                            )
                                          }
                                        />
                                        <Space>
                                          <Button
                                            type="primary"
                                            size="small"
                                            loading={updatingComment}
                                            disabled={
                                              !editingCommentBody.trim()
                                            }
                                            onClick={() =>
                                              void handleSaveCommentEdit(
                                                entry.id,
                                              )
                                            }
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            size="small"
                                            onClick={() =>
                                              setEditingCommentId(null)
                                            }
                                          >
                                            Cancel
                                          </Button>
                                        </Space>
                                      </Space>
                                    ) : (
                                      <p className={styles.commentBody}>
                                        {entry.body}
                                      </p>
                                    )}
                                  </article>
                                );
                              })}
                            </div>
                          ) : (
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description="No replies yet. Start the conversation above."
                            />
                          ))}
                      </div>
                    ),
                  },
                  {
                    key: 'attachments',
                    label: (
                      <Space size={6}>
                        <PaperClipOutlined />
                        <span>Attachments ({attachmentsList.length})</span>
                      </Space>
                    ),
                    children: (
                      <TicketAttachments
                        ticketKey={key}
                        attachments={attachmentsList}
                        currentUserId={currentUserId}
                        canManage={canManage}
                        onChanged={refetchDetail}
                      />
                    ),
                  },
                  {
                    key: 'work-logs',
                    label: 'Work logs',
                    children: <TicketWorkLogs key={key} ticketKey={key} onChanged={refresh} />,
                  },
                  {
                    key: 'activity',
                    label: (
                      <Space size={6}>
                        <HistoryOutlined />
                        <span>Activity ({activityList.length})</span>
                      </Space>
                    ),
                    children: activityError ? (
                      <InlineAlert
                        variant="error"
                        title="Unable to load ticket activity"
                        onRetry={() => void refetchActivity()}
                      />
                    ) : activityList.length ? (
                      <div style={{ paddingTop: 8 }}>
                        <Timeline
                          items={activityList.map((event) => {
                            const resolveUserName = (raw: string) => {
                              const match = userDirectoryByUsername.get(
                                raw.trim().toLowerCase(),
                              );
                              return match
                                ? userLabel(match) || raw
                                : raw;
                            };
                            const matchedActor = userDirectoryByUsername.get(
                              (event.actor_name || '').trim().toLowerCase(),
                            );
                            const details = formatTicketActivityLines(
                              event,
                              resolveUserName,
                            );
                            return {
                              key: event.id,
                              children: (
                                <div className={styles.activityItem}>
                                  <div className={styles.activityTitle}>
                                    {matchedActor ? (
                                      <TicketUserChip user={matchedActor} />
                                    ) : (
                                      <strong>{event.actor_name}</strong>
                                    )}
                                    <span>·</span>
                                    <span>{activityLabel(event)}</span>
                                    <Typography.Text
                                      type="secondary"
                                      style={{ fontSize: 11.5 }}
                                    >
                                      {formatDate(event.occurred_at)}
                                    </Typography.Text>
                                  </div>
                                  {details.length > 0 && (
                                    <div className={styles.activityDetailList}>
                                      {details.map((line, idx) => (
                                        <span key={idx}>{line}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ),
                            };
                          })}
                        />
                      </div>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No activity recorded yet"
                      />
                    ),
                  },
                ]}
              />
            </div>
          </section>
        </div>

        {/* Right Sticky Sidebar: Direct / Instant Properties & Triage */}
        <aside
          className={styles.sidebarColumn}
          aria-label="Ticket properties and triage"
        >
          <div className={styles.panelCard}>
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Ticket properties</h2>
              {(updatingTicket || assigning || transitioning) && (
                <Spin size="small" />
              )}
            </header>

            {ticket.version === undefined && (
              <div style={{ padding: '12px 16px 0' }}>
                <InlineAlert
                  variant="warning"
                  compact
                  title="Updates temporarily unavailable"
                  description="Refresh the ticket to retrieve its latest version."
                />
              </div>
            )}

            {/* Section 1: Workflow & Ownership */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarSectionTitle}>
                Workflow & Ownership
              </h3>

              {/* Status Field */}
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <span className={styles.fieldLabel}>Status</span>
                </div>
                {canManage && (statuses?.data?.length ?? 0) > 0 ? (
                  <Select<number>
                    aria-label="Ticket status"
                    value={ticket.status?.id}
                    loading={transitioning && savingField === 'status'}
                    disabled={ticket.version === undefined}
                    onChange={(nextStatusId) =>
                      initiateStatusTransition(nextStatusId)
                    }
                    style={{ width: '100%' }}
                    options={(statuses?.data ?? []).map((st) => ({
                      value: st.id,
                      label: (
                        <TicketStatusBadge
                          status={st.name}
                          compact
                          showTooltip={false}
                        />
                      ),
                    }))}
                  />
                ) : (
                  <div>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                )}
              </div>

              {/* Assignee Field */}
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <span className={styles.fieldLabel}>Assignee</span>
                  {canManage && (
                    <Space size={8}>
                      {currentUserId &&
                        ticket.assignee?.id !== currentUserId && (
                          <button
                            type="button"
                            className={styles.quickActionBtn}
                            disabled={assigning}
                            onClick={() =>
                              void handleDirectAssign(currentUserId)
                            }
                          >
                            Assign to me
                          </button>
                        )}
                      {ticket.assignee && (
                        <button
                          type="button"
                          className={styles.quickActionBtn}
                          disabled={assigning}
                          onClick={() => void handleDirectAssign(null)}
                        >
                          Unassign
                        </button>
                      )}
                    </Space>
                  )}
                </div>
                {canManage ? (
                  <Select<number>
                    aria-label="Assign ticket"
                    showSearch
                    optionFilterProp="label"
                    value={ticket.assignee?.id ?? UNASSIGN}
                    loading={assigning && savingField === 'assignee'}
                    disabled={ticket.version === undefined}
                    onChange={(val) =>
                      void handleDirectAssign(val === UNASSIGN ? null : val)
                    }
                    style={{ width: '100%' }}
                    options={assigneeOptions}
                  />
                ) : (
                  <div>
                    <TicketUserChip
                      user={ticket.assignee}
                      emptyLabel="Unassigned"
                    />
                  </div>
                )}
              </div>

              {/* Team Field */}
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <span className={styles.fieldLabelGroup}>
                    <span className={styles.fieldLabel}>Support Team</span>
                    <Tooltip title="Resolver group (queue) responsible for this ticket. Team members receive routing alerts and the team lead receives SLA breach escalations.">
                      <InfoCircleOutlined className={styles.fieldInfoIcon} />
                    </Tooltip>
                  </span>
                </div>
                {canManage ? (
                  <Select<number>
                    aria-label="Support team"
                    placeholder="No team assigned"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    notFoundContent="No support teams configured"
                    value={ticket.team?.id ?? undefined}
                    loading={updatingTicket && savingField === 'team'}
                    disabled={ticket.version === undefined}
                    onChange={(val) =>
                      void handleFieldPatch(
                        'team',
                        { team_id: val ?? null },
                        val ? 'Support team updated' : 'Support team cleared',
                      )
                    }
                    style={{ width: '100%' }}
                    options={(teams?.data ?? []).map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                  />
                ) : (
                  <Typography.Text style={{ fontSize: 13 }}>
                    {ticket.team?.name || 'Unassigned'}
                  </Typography.Text>
                )}
              </div>

              {/* Watchers Field */}
              <div className={styles.fieldRow}>
                <div className={styles.fieldLabelRow}>
                  <span className={styles.fieldLabelGroup}>
                    <span className={styles.fieldLabel}>Watchers</span>
                    <span className={styles.watcherCountBadge}>
                      {ticket.watchers?.length ?? 0}
                    </span>
                    <Tooltip title="People subscribed to receive notifications whenever this ticket is updated or commented on.">
                      <InfoCircleOutlined className={styles.fieldInfoIcon} />
                    </Tooltip>
                  </span>
                  <button
                    type="button"
                    className={styles.quickActionBtn}
                    disabled={addingWatcher || removingWatcher}
                    onClick={() => void handleToggleWatch()}
                  >
                    {ticket.is_watching ? 'Stop watching' : 'Watch'}
                  </button>
                </div>

                {ticket.watchers && ticket.watchers.length > 0 ? (
                  <div className={styles.watchersList}>
                    {ticket.watchers.map((watcher) => {
                      const canRemoveThis =
                        canManage ||
                        (currentUserId !== null &&
                          watcher.user.id === currentUserId);
                      const watcherName =
                        userLabel(watcher.user) || watcher.user.username;
                      return (
                        <TicketUserChip
                          key={watcher.user.id}
                          user={watcher.user}
                          removing={removingWatcher}
                          onRemove={
                            canRemoveThis
                              ? () =>
                                  void handleRemoveWatcher(
                                    watcher.user.id,
                                    watcherName,
                                  )
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    No watchers subscribed yet.
                  </Typography.Text>
                )}

                {canManage && (
                  <Select<number>
                    aria-label="Add watcher"
                    placeholder="+ Add watcher…"
                    showSearch
                    optionFilterProp="label"
                    value={null}
                    loading={addingWatcher}
                    notFoundContent="No available users to add"
                    onChange={(userId) => {
                      if (userId) void handleAddWatcher(userId);
                    }}
                    style={{ width: '100%', marginTop: 4 }}
                    options={watcherCandidateOptions}
                  />
                )}
              </div>
            </div>

            {/* Section 2: Classification & Triage */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarSectionTitle}>
                Classification & Triage
              </h3>

              {/* Priority Field */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Priority</span>
                {canManage && (priorities?.data?.length ?? 0) > 0 ? (
                  <Select<number>
                    aria-label="Ticket priority"
                    value={ticket.priority?.id}
                    loading={updatingTicket && savingField === 'priority'}
                    disabled={ticket.version === undefined}
                    onChange={(nextPriorityId) =>
                      void handleFieldPatch(
                        'priority',
                        { priority_id: nextPriorityId },
                        'Priority updated',
                      )
                    }
                    style={{ width: '100%' }}
                    options={(priorities?.data ?? []).map((p) => ({
                      value: p.id,
                      label: (
                        <TicketPriorityBadge
                          priority={p.name}
                          showTooltip={false}
                        />
                      ),
                    }))}
                  />
                ) : (
                  <div>
                    <TicketPriorityBadge
                      priority={ticket.priority?.name ?? 'Medium'}
                    />
                  </div>
                )}
              </div>

              {/* Category Field */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Category</span>
                {canManage && (categories?.data?.length ?? 0) > 0 ? (
                  <Select<number>
                    aria-label="Ticket category"
                    showSearch
                    optionFilterProp="label"
                    value={ticket.category?.id}
                    loading={updatingTicket && savingField === 'category'}
                    disabled={ticket.version === undefined}
                    onChange={(nextCategoryId) =>
                      void handleFieldPatch(
                        'category',
                        { category_id: nextCategoryId },
                        'Category updated',
                      )
                    }
                    style={{ width: '100%' }}
                    options={(categories?.data ?? []).map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                ) : (
                  <div>
                    <span className={styles.categoryChip}>
                      {ticket.category?.name ?? '–'}
                    </span>
                  </div>
                )}
              </div>

              {/* Request Type Field */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Request Type</span>
                {canEditCoreFields && !currentStatusMeta.isTerminal ? (
                  <Select<TicketTypeEnum>
                    aria-label="Request type"
                    value={
                      (ticket.ticket_type?.value as TicketTypeEnum) ??
                      'incident'
                    }
                    loading={updatingTicket && savingField === 'ticket_type'}
                    disabled={ticket.version === undefined}
                    onChange={(nextType) =>
                      void handleFieldPatch(
                        'ticket_type',
                        { ticket_type: nextType },
                        'Request type updated',
                      )
                    }
                    style={{ width: '100%' }}
                    options={TICKET_TYPE_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                  />
                ) : (
                  <div>
                    <TicketTypeBadge ticketType={ticket.ticket_type} />
                  </div>
                )}
              </div>

              {/* Impact & Urgency 2-Column Grid */}
              <div className={styles.fieldGrid2}>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Impact</span>
                  {canEditCoreFields && !currentStatusMeta.isTerminal ? (
                    <Select<UrgencyEnum>
                      aria-label="Impact"
                      placeholder="Not set"
                      allowClear
                      value={
                        ticket.impact
                          ? (ticket.impact as UrgencyEnum)
                          : undefined
                      }
                      loading={updatingTicket && savingField === 'impact'}
                      disabled={ticket.version === undefined}
                      onChange={(val) =>
                        void handleFieldPatch(
                          'impact',
                          { impact: val ?? '' },
                          'Impact updated',
                        )
                      }
                      style={{ width: '100%' }}
                      options={[...IMPACT_URGENCY_OPTIONS]}
                    />
                  ) : (
                    <Typography.Text style={{ fontSize: 12.5 }}>
                      {IMPACT_URGENCY_OPTIONS.find(
                        (o) => o.value === ticket.impact,
                      )?.label || '–'}
                    </Typography.Text>
                  )}
                </div>

                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>Urgency</span>
                  {canEditCoreFields && !currentStatusMeta.isTerminal ? (
                    <Select<UrgencyEnum>
                      aria-label="Urgency"
                      placeholder="Not set"
                      allowClear
                      value={
                        ticket.urgency
                          ? (ticket.urgency as UrgencyEnum)
                          : undefined
                      }
                      loading={updatingTicket && savingField === 'urgency'}
                      disabled={ticket.version === undefined}
                      onChange={(val) =>
                        void handleFieldPatch(
                          'urgency',
                          { urgency: val ?? '' },
                          'Urgency updated',
                        )
                      }
                      style={{ width: '100%' }}
                      options={[...IMPACT_URGENCY_OPTIONS]}
                    />
                  ) : (
                    <Typography.Text style={{ fontSize: 12.5 }}>
                      {IMPACT_URGENCY_OPTIONS.find(
                        (o) => o.value === ticket.urgency,
                      )?.label || '–'}
                    </Typography.Text>
                  )}
                </div>
              </div>

              {/* Target Due Date Field */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Target Due Date</span>
                {canEditCoreFields && !currentStatusMeta.isTerminal ? (
                  <DatePicker
                    aria-label="Target due date"
                    style={{ width: '100%' }}
                    value={ticket.due_date ? dayjs(ticket.due_date) : null}
                    disabled={
                      ticket.version === undefined ||
                      (updatingTicket && savingField === 'due_date')
                    }
                    onChange={(dateVal) =>
                      void handleFieldPatch(
                        'due_date',
                        {
                          due_date: dateVal
                            ? dateVal.format('YYYY-MM-DD')
                            : null,
                        },
                        dateVal ? 'Due date updated' : 'Due date cleared',
                      )
                    }
                  />
                ) : (
                  <Typography.Text style={{ fontSize: 12.5 }}>
                    {ticket.due_date || 'None'}
                  </Typography.Text>
                )}
              </div>
            </div>

            {/* Section 3: Metadata & External Reference */}
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarSectionTitle}>Record Details</h3>
              <dl className={styles.metaList}>
                <div className={styles.metaRow}>
                  <dt>Requester</dt>
                  <dd>
                    <TicketUserChip user={ticket.requester} />
                  </dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>Created</dt>
                  <dd>{formatDate(ticket.created_at)}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>Updated</dt>
                  <dd>{formatDate(ticket.updated_at)}</dd>
                </div>
                {ticket.first_response_at && (
                  <div className={styles.metaRow}>
                    <dt>First response</dt>
                    <dd>{formatDate(ticket.first_response_at)}</dd>
                  </div>
                )}
                {ticket.resolved_at && (
                  <div className={styles.metaRow}>
                    <dt>Resolved</dt>
                    <dd>{formatDate(ticket.resolved_at)}</dd>
                  </div>
                )}
                {ticket.closed_at && (
                  <div className={styles.metaRow}>
                    <dt>Closed</dt>
                    <dd>{formatDate(ticket.closed_at)}</dd>
                  </div>
                )}
              </dl>

              {/* External Reference */}
              <div className={styles.fieldRow} style={{ marginTop: 4 }}>
                <div className={styles.fieldLabelRow}>
                  <span className={styles.fieldLabel}>External Reference</span>
                  {canEditCoreFields && !isEditingExtRef && (
                    <button
                      type="button"
                      className={styles.quickActionBtn}
                      onClick={() => {
                        setExtRefDraft(ticket.external_reference || '');
                        setIsEditingExtRef(true);
                      }}
                    >
                      {ticket.external_reference ? 'Edit' : '+ Add'}
                    </button>
                  )}
                </div>
                {isEditingExtRef ? (
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      size="small"
                      aria-label="External reference"
                      placeholder="Vendor RMA / case ID"
                      value={extRefDraft}
                      onChange={(e) => setExtRefDraft(e.target.value)}
                    />
                    <Button
                      size="small"
                      type="primary"
                      loading={
                        updatingTicket && savingField === 'external_reference'
                      }
                      onClick={() => {
                        void handleFieldPatch(
                          'external_reference',
                          { external_reference: extRefDraft.trim() },
                          'External reference updated',
                        ).then((ok) => {
                          if (ok) setIsEditingExtRef(false);
                        });
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setIsEditingExtRef(false)}
                    >
                      Cancel
                    </Button>
                  </Space.Compact>
                ) : (
                  <Typography.Text
                    type={ticket.external_reference ? undefined : 'secondary'}
                    style={{ fontSize: 12.5 }}
                  >
                    {ticket.external_reference || 'None'}
                  </Typography.Text>
                )}
              </div>

              {/* Linked Lab Resources */}
              {(ticket.resource_links?.length ?? 0) > 0 && (
                <div className={styles.fieldRow} style={{ marginTop: 4 }}>
                  <span className={styles.fieldLabel}>Linked Lab Resources</span>
                  <Space size={6} wrap>
                    {ticket.resource_links.map((link) => (
                      <span key={link.id} className={styles.categoryChip}>
                        {link.badge ||
                          `${link.resource.type}: ${link.resource.name}`}
                      </span>
                    ))}
                  </Space>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Focused Status Transition Modal (shown only when Resolution Summary or Reason is required) */}
      <Modal
        title={
          pendingTransition
            ? `Transition to ${pendingTransition.statusName}`
            : 'Update ticket status'
        }
        open={pendingTransition !== null}
        onCancel={() => setPendingTransition(null)}
        confirmLoading={transitioning}
        okText={
          pendingTransition?.requiresResolution
            ? 'Resolve ticket'
            : pendingTransition?.isReopen
              ? 'Reopen ticket'
              : `Move to ${pendingTransition?.statusName ?? 'status'}`
        }
        okButtonProps={{
          disabled:
            (pendingTransition?.requiresResolution &&
              !resolutionSummary.trim()) ||
            (pendingTransition?.requiresReason && !transitionReason.trim()),
        }}
        onOk={() => {
          if (!pendingTransition) return;
          void executeTransition({
            toStatusId: pendingTransition.statusId,
            toStatusName: pendingTransition.statusName,
            reason: transitionReason,
            resolutionSummary: pendingTransition.requiresResolution
              ? resolutionSummary
              : undefined,
            resolutionCode: pendingTransition.requiresResolution
              ? resolutionCode
              : undefined,
            rootCause: pendingTransition.requiresResolution
              ? rootCause
              : undefined,
          });
        }}
        destroyOnHidden
      >
        {pendingTransition && (
          <Form layout="vertical" style={{ marginTop: 12 }}>
            {pendingTransition.requiresResolution && (
              <>
                <Form.Item label="Resolution code" required>
                  <Select<ResolutionCodeEnum>
                    aria-label="Resolution code"
                    value={resolutionCode}
                    onChange={setResolutionCode}
                    options={[...RESOLUTION_CODE_OPTIONS]}
                  />
                </Form.Item>
                <Form.Item
                  label="Resolution summary"
                  required
                  extra="Describe how the issue or request was resolved. Visible on the ticket record."
                >
                  <Input.TextArea
                    aria-label="Resolution summary"
                    rows={4}
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    placeholder="What was done to resolve this ticket?"
                  />
                </Form.Item>
                <Form.Item label="Root cause (optional)">
                  <Input.TextArea
                    aria-label="Root cause"
                    rows={2}
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Underlying cause for recurring or technical incidents (optional)"
                  />
                </Form.Item>
              </>
            )}

            <Form.Item
              label={
                pendingTransition.requiresReason
                  ? 'Reason (required)'
                  : 'Transition note (optional)'
              }
              required={pendingTransition.requiresReason}
            >
              <Input.TextArea
                aria-label="Transition reason"
                rows={3}
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder={
                  pendingTransition.isReopen
                    ? 'Why does this ticket need to be reopened?'
                    : 'Provide context for this status change…'
                }
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}