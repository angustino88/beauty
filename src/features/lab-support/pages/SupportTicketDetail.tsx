import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Button,
  DatePicker,
  Empty,
  Input,
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
  ClockCircleOutlined,
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
import { useAppDispatch } from '@/app/store';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { useCan } from '@/features/auth/hooks/useCan';
import {
  generatedApi,
  useSupportCannedResponsesRetrieveQuery,
  useSupportCategoriesOptionsRetrieveQuery,
  useSupportPrioritiesOptionsRetrieveQuery,
  useSupportTeamsOptionsRetrieveQuery,
  useSupportTicketsActionsAssignCreateByKeyMutation,
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
  type TicketActivityRead,
  type TicketDetailRead,
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
import { TicketAttachments } from '../components/TicketAttachments';
import { SupportPeopleSelect } from '../components/SupportPeopleSelect';
import { TicketWorkflow } from '../components/TicketWorkflow';
import { TicketWorkLogs } from '../components/TicketWorkLogs';
import {
  TicketPriorityBadge,
  TicketSlaBadge,
  TicketStatusBadge,
  TicketTypeBadge,
  TicketUserChip,
} from '../components/TicketBadges';
import styles from '../components/SupportTickets.module.css';
import {
  createTicketWriteQueue,
  isTicketVersionConflict,
  type RunTicketWrite,
} from '../ticketWriteQueue';
import {
  IMPACT_URGENCY_OPTIONS,
  TICKET_TYPE_OPTIONS,
  formatTicketActivityLines,
  getTicketStatusMeta,
  getResolutionLabel,
} from '../ticketPresentation';

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '–';

const errorMessage = (error: unknown) => apiErrorMessage(error);

function activityLabel(activity: TicketActivityRead) {
  return activity.event_type.label;
}

export default function SupportTicketDetail() {
  const { key } = useParams<{ key: string }>();
  if (!key) return <InlineAlert variant="error" title="Missing ticket key" />;
  return <TicketDetail key={key} ticketKey={key} />;
}

function TicketDetail({ ticketKey: key }: { ticketKey: string }) {
  const { state } = useLocation();
  const queueSearch = typeof state?.queueSearch === 'string' ? state.queueSearch : '';
  const dispatch = useAppDispatch();
  const { id: currentUserId } = useAuthState();
  const can = useCan();
  const canManage = can('support.handle') || can('support.administer');
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = requestedTab && ['attachments', 'activity', 'work-logs'].includes(requestedTab)
    ? requestedTab
    : 'conversation';
  const setActiveTab = (tab: string) => setSearchParams((params) => {
    if (tab === 'conversation') params.delete('tab');
    else params.set('tab', tab);
    return params;
  }, { replace: true });

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

  const [enqueueWrite] = useState(() => createTicketWriteQueue<TicketDetailRead>());
  const pendingFields = useRef(new Set<string>());
  const [savingFields, setSavingFields] = useState<ReadonlySet<string>>(() => new Set());
  const isSaving = (field: string) => savingFields.has(field);

  const ticketArg = { key };

  const {
    currentData: detail,
    isLoading,
    isError,
    refetch: refetchDetail,
  } = useSupportTicketsRetrieveByKeyQuery(ticketArg);
  const {
    data: comments,
    refetch: refetchComments,
    isError: commentsError,
  } = useSupportTicketsCommentsRetrieveByKeyQuery(ticketArg);
  const {
    data: activity,
    refetch: refetchActivity,
    isError: activityError,
  } = useSupportTicketsActivityRetrieveByKeyQuery(ticketArg);

  const ticket = detail?.data;
  const isRequester = Boolean(
    currentUserId && ticket?.requester?.id === currentUserId,
  );
  const canEditCoreFields = canManage || isRequester;

  const { data: categories } = useSupportCategoriesOptionsRetrieveQuery(
    {
      includeIds: ticket?.category?.id ? [ticket.category.id] : undefined,
    },
    { skip: !canManage },
  );
  const { data: priorities } = useSupportPrioritiesOptionsRetrieveQuery(
    {
      includeIds: ticket?.priority?.id ? [ticket.priority.id] : undefined,
    },
    { skip: !canManage },
  );
  const { data: teams } = useSupportTeamsOptionsRetrieveQuery(
    {
      includeIds: ticket?.team?.id ? [ticket.team.id] : undefined,
    },
    { skip: !canManage },
  );
  const { data: users } = useUsersRetrieveQuery(
    {},
    { skip: !canManage },
  );
  const { data: cannedResponses } = useSupportCannedResponsesRetrieveQuery(
    undefined,
    { skip: !canManage },
  );

  const [updateTicket] = useSupportTicketsPartialUpdateByKeyMutation();
  const [postComment, { isLoading: posting }] =
    useSupportTicketsCommentsCreateByKeyMutation();
  const [updateComment, { isLoading: updatingComment }] =
    useSupportTicketsCommentsPartialUpdateByKeyCommentIdMutation();
  const [deleteComment] =
    useSupportTicketsCommentsDestroyByKeyCommentIdMutation();
  const [uploadAttachment, { isLoading: uploadingReplyFiles }] =
    useUploadSupportAttachmentMutation();
  const [assign] = useSupportTicketsActionsAssignCreateByKeyMutation();
  const [addWatcher, { isLoading: addingWatcher }] =
    useSupportTicketsWatchersCreateByKeyMutation();
  const [removeWatcher, { isLoading: removingWatcher }] =
    useRemoveSupportWatcherMutation();

  const refresh = async () => {
    await Promise.all([refetchDetail(), refetchComments(), refetchActivity()]);
  };

  const runTicketWrite: RunTicketWrite = async (field, write) => {
    if (!ticket || ticket.version === undefined) throw new Error('Refresh the ticket before saving.');
    if (pendingFields.current.has(field)) throw new Error('This field is already being saved.');
    pendingFields.current.add(field);
    setSavingFields(new Set(pendingFields.current));

    try {
      await enqueueWrite(ticket, async (current, version) => {
        try {
          const updated = await write(current, version);
          dispatch(generatedApi.util.updateQueryData('supportTicketsRetrieveByKey', ticketArg, (draft) => {
            if ((updated.version ?? -1) >= (draft.data.version ?? -1)) draft.data = updated;
          }));
          return updated;
        } catch (error) {
          if (isTicketVersionConflict(error)) await refetchDetail();
          throw error;
        }
      });
    } finally {
      pendingFields.current.delete(field);
      setSavingFields(new Set(pendingFields.current));
      if (!pendingFields.current.size) {
        void refetchDetail();
        void refetchActivity();
      }
    }
  };

  const reportWriteError = (title: string, error: unknown) => {
    if (isTicketVersionConflict(error)) {
      notify.warning('Ticket changed while you were editing', {
        description: 'Review the latest values and apply your change again.',
      });
    } else {
      notify.error(title, { description: errorMessage(error) });
    }
  };

  const handleFieldPatch = async (
    fieldName: string,
    patch: Omit<PatchedTicketUpdateRequest, 'version'>,
    successMessage: string,
  ) => {
    if (pendingFields.current.has(fieldName)) return false;
    try {
      await runTicketWrite(fieldName, async (_current, version) => {
        const response = await updateTicket({
          key,
          patchedTicketUpdateRequest: { ...patch, version },
        }).unwrap();
        return response.data;
      });
      notify.success(successMessage);
      return true;
    } catch (error) {
      reportWriteError(`Unable to update ${fieldName.replaceAll('_', ' ')}`, error);
      return false;
    }
  };

  const handleDirectAssign = async (targetAssigneeId: number | null) => {
    if (pendingFields.current.has('assignee')) return;
    try {
      await runTicketWrite('assignee', async (current, version) => {
        if ((current.assignee?.id ?? null) === targetAssigneeId) return current;
        const response = await assign({
          key,
          ticketAssignRequest: { assignee_id: targetAssigneeId, version },
        }).unwrap();
        return response.data;
      });
      notify.success(
        targetAssigneeId === null
          ? 'Ticket unassigned'
          : targetAssigneeId === currentUserId
            ? 'Assigned to you'
            : 'Ticket assignee updated',
      );
    } catch (error) {
      reportWriteError('Unable to update assignment', error);
    }
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
  const currentState = ticket.status_system_state?.value;
  const currentStatusMeta = getTicketStatusMeta(ticket.status, currentState, ticket.is_status_final);
  const watcherIds = (ticket.watchers ?? []).map((watcher) => watcher.user.id);

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
            <TicketStatusBadge status={ticket.status} systemState={currentState} isFinal={ticket.is_status_final} />
            {ticket.priority && (
              <TicketPriorityBadge priority={ticket.priority} />
            )}
            <TicketTypeBadge ticketType={ticket.ticket_type} />
            <TicketSlaBadge sla={ticket.sla} status={ticket.status} />
          </div>

          <TicketWorkflow ticket={ticket} runTicketWrite={runTicketWrite} isSaving={isSaving('status')} />
        </div>

        {/* Ticket Subject with Inline Edit */}
        <div className={styles.titleRow}>
          {isEditingSubject ? (
            <div className={styles.titleEditBox}>
              <Input
                aria-label="Edit ticket subject"
                disabled={isSaving('subject')}
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
                loading={isSaving('subject')}
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
                disabled={isSaving('subject')}
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
          {currentStatusMeta.isTerminal && (ticket.resolution_summary || ticket.resolution_code) && (
            <section
              className={styles.resolutionBanner}
              aria-label="Ticket resolution"
            >
              <div className={styles.resolutionHeader}>
                <span className={styles.resolutionTitle}>
                  <CheckCircleOutlined />
                  <span>
                    {ticket.resolution_code ? getResolutionLabel(ticket.resolution_code) : 'Ticket outcome'}
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
                    disabled={isSaving('description')}
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
                      loading={isSaving('description')}
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
                      disabled={isSaving('description')}
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
                      disabled={isSaving('labels')}
                      style={{ minWidth: 240 }}
                      tokenSeparators={[',']}
                      value={labelsDraft}
                      onChange={setLabelsDraft}
                      placeholder="Add labels (e.g. calibration, network)"
                    />
                    <Button
                      type="primary"
                      size="small"
                      loading={isSaving('labels')}
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
                      disabled={isSaving('labels')}
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
                    label: <Space size={6}><ClockCircleOutlined /><span>Work logs</span></Space>,
                    children: <TicketWorkLogs key={ticket.key} ticketKey={ticket.key} onUpdated={refetchActivity} />,
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
              {savingFields.size > 0 && (
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
                            disabled={isSaving('assignee')}
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
                          disabled={isSaving('assignee')}
                          onClick={() => void handleDirectAssign(null)}
                        >
                          Unassign
                        </button>
                      )}
                    </Space>
                  )}
                </div>
                {canManage ? (
                  <SupportPeopleSelect<number | null>
                    aria-label="Assign ticket"
                    value={ticket.assignee?.id ?? null}
                    assigneesOnly
                    suggestIds={currentUserId ? [currentUserId] : []}
                    includePeople={ticket.assignee ? [{
                      value: ticket.assignee.id,
                      label: userLabel(ticket.assignee) || ticket.assignee.username,
                    }] : []}
                    placeholder="Unassigned"
                    disabled={isSaving('assignee') || ticket.version === undefined}
                    onChange={(value) => void handleDirectAssign(value)}
                    style={{ width: '100%' }}
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
                    loading={isSaving('team')}
                    disabled={ticket.version === undefined || isSaving('team')}
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
                  <SupportPeopleSelect<number | null>
                    aria-label="Add watcher"
                    placeholder="Add watcher"
                    value={null}
                    disabled={addingWatcher}
                    excludeIds={watcherIds}
                    onChange={(userId) => {
                      if (userId) void handleAddWatcher(userId);
                    }}
                    style={{ width: '100%', marginTop: 4 }}
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
                    loading={isSaving('priority')}
                    disabled={ticket.version === undefined || isSaving('priority')}
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
                    loading={isSaving('category')}
                    disabled={ticket.version === undefined || isSaving('category')}
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
                    loading={isSaving('ticket_type')}
                    disabled={ticket.version === undefined || isSaving('ticket_type')}
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
                      loading={isSaving('impact')}
                      disabled={ticket.version === undefined || isSaving('impact')}
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
                      loading={isSaving('urgency')}
                      disabled={ticket.version === undefined || isSaving('urgency')}
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
                    disabled={ticket.version === undefined || isSaving('due_date')}
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
                      disabled={isSaving('external_reference')}
                      placeholder="Vendor RMA / case ID"
                      value={extRefDraft}
                      onChange={(e) => setExtRefDraft(e.target.value)}
                    />
                    <Button
                      size="small"
                      type="primary"
                      loading={isSaving('external_reference')}
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
                      disabled={isSaving('external_reference')}
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

    </div>
  );
}
