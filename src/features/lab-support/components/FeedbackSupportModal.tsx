import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Modal, Select, Tooltip } from 'antd';
import {
  Bug,
  FileText,
  Layers,
  LifeBuoy,
  MessageSquare,
  Monitor,
  Paperclip,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useTheme } from '@/shared/theme/ThemeContext';
import { InlineAlert, notify } from '@/shared/notifications';
import {
  useCreateSupportTicketMutation,
  useGetSupportCategoriesQuery,
  useGetSupportPrioritiesQuery,
  useUploadSupportAttachmentMutation,
} from '../api';
import {
  SUPPORT_ATTACHMENT_ACCEPT,
  apiErrorMessage,
  formatFileSize,
} from '../attachments';
import {
  FEEDBACK_MAX_ATTACHMENTS,
  FEEDBACK_TYPE_CONFIGS,
  buildClientContext,
  createIdempotencyKey,
  getFeedbackTypeConfig,
  mergeAttachmentFiles,
  normalizeFeedbackPagePath,
  resolveDefaultCategoryId,
  type FeedbackPillKey,
} from '../feedbackContext';
import { TicketPriorityBadge } from './TicketBadges';
import styles from './FeedbackSupportModal.module.css';

interface FeedbackSupportModalProps {
  open: boolean;
  onClose: () => void;
  initialType?: FeedbackPillKey;
  onCreated?: (ticketKey: string) => void;
}

interface AttachedItem {
  id: string;
  file: File;
  previewUrl: string | null;
}

const TYPE_META: Record<
  FeedbackPillKey,
  { subtitle: string; accentClass: string; shortSubmit: string }
> = {
  support: {
    subtitle: 'Lab & IT help',
    accentClass: styles.accentSuccess,
    shortSubmit: 'Send request',
  },
  bug: {
    subtitle: 'Report a glitch',
    accentClass: styles.accentDanger,
    shortSubmit: 'Report bug',
  },
  feature: {
    subtitle: 'Suggest an idea',
    accentClass: styles.accentInfo,
    shortSubmit: 'Submit idea',
  },
  feedback: {
    subtitle: 'UX & thoughts',
    accentClass: styles.accentPrimary,
    shortSubmit: 'Send feedback',
  },
};

function PillIcon({ pillKey, size = 15 }: { pillKey: FeedbackPillKey; size?: number }): ReactNode {
  switch (pillKey) {
    case 'support':
      return <LifeBuoy size={size} aria-hidden="true" />;
    case 'bug':
      return <Bug size={size} aria-hidden="true" />;
    case 'feature':
      return <Layers size={size} aria-hidden="true" />;
    case 'feedback':
      return <MessageSquare size={size} aria-hidden="true" />;
  }
}

export default function FeedbackSupportModal({
  open,
  onClose,
  initialType = 'feedback',
  onCreated,
}: FeedbackSupportModalProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const idempotencyKeyRef = useRef<string>(createIdempotencyKey());
  const dragDepthRef = useRef(0);

  const [selectedType, setSelectedType] = useState<FeedbackPillKey>(initialType);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priorityId, setPriorityId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<AttachedItem[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createTicket] = useCreateSupportTicketMutation();
  const [uploadAttachment] = useUploadSupportAttachmentMutation();
  const { data: categoriesData, isFetching: categoriesLoading } = useGetSupportCategoriesQuery(
    {},
    { skip: !open },
  );
  const { data: prioritiesData, isFetching: prioritiesLoading } = useGetSupportPrioritiesQuery(
    {},
    { skip: !open },
  );

  const typeConfig = getFeedbackTypeConfig(selectedType);
  const activeMeta = TYPE_META[selectedType];
  const pagePath = useMemo(() => normalizeFeedbackPagePath(location.pathname), [location.pathname]);

  const clientContext = useMemo(
    () =>
      buildClientContext({
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        innerWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
        innerHeight: typeof window !== 'undefined' ? window.innerHeight : undefined,
        theme: isDark ? 'dark' : 'light',
        language: typeof navigator !== 'undefined' ? navigator.language : '',
      }),
    [isDark],
  );

  const resolvedDefaultCategoryId = useMemo(
    () => resolveDefaultCategoryId(categoriesData?.data ?? [], typeConfig.ticketType),
    [categoriesData?.data, typeConfig.ticketType],
  );

  const effectiveCategoryId = categoryId ?? resolvedDefaultCategoryId;
  const attachmentsRef = useRef<AttachedItem[]>([]);

  useEffect(() => {
    if (open) {
      idempotencyKeyRef.current = createIdempotencyKey();
    }
  }, [open]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      for (const item of attachmentsRef.current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const resetForm = () => {
    for (const item of attachments) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    setSelectedType(initialType);
    setSubject('');
    setDetails('');
    setAttachments([]);
    setCategoryId(null);
    setPriorityId(null);
    setIncludeContext(true);
    setIsDraggingFiles(false);
    dragDepthRef.current = 0;
    setFormError(null);
    idempotencyKeyRef.current = createIdempotencyKey();
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const addFiles = (incomingList: File[]) => {
    if (incomingList.length === 0) return;
    const existingFiles = attachments.map((item) => item.file);
    const { files: merged, skippedCount } = mergeAttachmentFiles(
      existingFiles,
      incomingList,
      FEEDBACK_MAX_ATTACHMENTS,
    );
    const addedFiles = merged.slice(existingFiles.length);
    if (addedFiles.length > 0) {
      const nextItems: AttachedItem[] = addedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      }));
      setAttachments((prev) => [...prev, ...nextItems]);
    }
    if (skippedCount > 0) {
      notify.warning(`Maximum ${FEEDBACK_MAX_ATTACHMENTS} attachments allowed`, {
        description: `${skippedCount} ${skippedCount === 1 ? 'file was' : 'files were'} skipped.`,
      });
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    const pastedFiles: File[] = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          const namedFile =
            !file.name || file.name === 'image.png'
              ? new File([file], `screenshot-${Date.now()}-${i + 1}.png`, {
                  type: file.type || 'image/png',
                })
              : file;
          pastedFiles.push(namedFile);
        }
      }
    }
    if (pastedFiles.length > 0) {
      addFiles(pastedFiles);
    }
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    if (!submitting) setIsDraggingFiles(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDraggingFiles(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFiles(false);
    if (submitting) return;
    addFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const handleInsertTemplate = () => {
    if (!details.trim()) {
      setDetails(typeConfig.detailsTemplate);
      return;
    }
    setDetails((prev) => `${prev.trimEnd()}\n\n${typeConfig.detailsTemplate}`);
  };

  const canSubmit = Boolean(subject.trim() && details.trim()) && !submitting;

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canSubmit) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedDetails = details.trim();
    if (!trimmedSubject) {
      setFormError('Please enter a short summary.');
      return;
    }
    if (!trimmedDetails) {
      setFormError('Please add details before submitting.');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const ticket = await createTicket({
        subject: trimmedSubject,
        description: trimmedDetails,
        ticket_type: typeConfig.ticketType,
        category_id: effectiveCategoryId ?? null,
        priority_id: priorityId ?? null,
        page_path: includeContext ? pagePath : '',
        client_context: includeContext ? clientContext : {},
        idempotency_key: idempotencyKeyRef.current,
      }).unwrap();

      const ticketKey = ticket.key || `#${ticket.id}`;
      const failedUploads: string[] = [];
      for (const item of attachments) {
        try {
          await uploadAttachment({ key: ticket.key, file: item.file }).unwrap();
        } catch (uploadError) {
          failedUploads.push(`${item.file.name}: ${apiErrorMessage(uploadError)}`);
        }
      }

      if (failedUploads.length > 0) {
        notify.warning(`${typeConfig.label} submitted, but some attachments failed`, {
          code: ticketKey,
          description: `${failedUploads.join(' ')} You can upload them from the ticket page.`,
          duration: 10000,
          action: {
            label: 'View ticket',
            onClick: () => navigate(`/support-tickets/${encodeURIComponent(ticket.key)}`),
          },
        });
      } else {
        notify.success(`${typeConfig.label} submitted`, {
          code: ticketKey,
          description: 'Tracked in Support Tickets so you can follow updates and replies.',
          action: {
            label: 'View ticket',
            onClick: () => navigate(`/support-tickets/${encodeURIComponent(ticket.key)}`),
          },
        });
      }

      resetForm();
      onClose();
      onCreated?.(ticket.key);
    } catch (error: unknown) {
      const msg = apiErrorMessage(error, 'Unable to submit right now. Please try again.');
      setFormError(msg);
      notify.error(`Unable to submit ${typeConfig.label.toLowerCase()}`, { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const diagnosticsTooltip = useMemo(() => {
    const parts: string[] = [];
    if (pagePath) parts.push(`Page: ${pagePath}`);
    if (clientContext.browser) parts.push(clientContext.browser);
    if (clientContext.os) parts.push(clientContext.os);
    if (clientContext.viewport) parts.push(clientContext.viewport);
    if (clientContext.theme) parts.push(`${clientContext.theme} theme`);
    const summary = parts.join(' · ') || 'No diagnostics detected';
    return includeContext
      ? `Attached automatically (${summary}). Click to exclude.`
      : 'Diagnostics excluded. Click to include page and browser info.';
  }, [includeContext, pagePath, clientContext]);

  const categoryOptions = (categoriesData?.data ?? []).map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const priorityOptions = (prioritiesData?.data ?? []).map((p) => ({
    value: p.id,
    searchLabel: p.name,
    label: <TicketPriorityBadge priority={p.name} showTooltip={false} />,
  }));

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={580}
      centered
      destroyOnHidden
      closable={!submitting}
      keyboard={!submitting}
      mask={{ closable: !submitting }}
      title={
        <div className={`${styles.modalHeader} ${activeMeta.accentClass}`}>
          <span className={styles.headerBadge} aria-hidden="true">
            <PillIcon pillKey={selectedType} size={17} />
          </span>
          <div className={styles.headerCopy}>
            <div className={styles.modalTitleRow}>
              <h2 className={styles.modalTitle}>Support &amp; Feedback</h2>
              <span className={styles.routePill}>Tracked in Support Desk</span>
            </div>
            <p className={styles.modalSubtitle}>{typeConfig.description}</p>
          </div>
        </div>
      }
    >
      <div
        className={styles.formBody}
        onPaste={handlePaste}
        onDragEnter={handleDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {formError && (
          <InlineAlert
            variant="error"
            title="Could not submit"
            description={formError}
          />
        )}

        {/* 4-Up Compact Semantic Type Cards */}
        <div
          className={styles.typeCardGrid}
          role="radiogroup"
          aria-label="Submission type"
        >
          {FEEDBACK_TYPE_CONFIGS.map((cfg) => {
            const isActive = cfg.key === selectedType;
            const meta = TYPE_META[cfg.key];
            return (
              <button
                key={cfg.key}
                type="button"
                role="radio"
                aria-checked={isActive}
                disabled={submitting}
                className={`${styles.typeCard} ${meta.accentClass} ${isActive ? styles.typeCardActive : ''}`}
                onClick={() => setSelectedType(cfg.key)}
              >
                <div className={styles.typeCardTop}>
                  <span className={styles.typeCardHeading}>
                    <PillIcon pillKey={cfg.key} size={14} />
                    <span>{cfg.label}</span>
                  </span>
                  {isActive && <span className={styles.typeCardDot} aria-hidden="true" />}
                </div>
                <span className={styles.typeCardSub}>{meta.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* Unified Command-Style Composer Card */}
        <div className={`${styles.composerShell} ${isDraggingFiles ? styles.composerDragging : ''}`}>
          <div className={styles.composerTitleRow}>
            <Input
              id="feedback-summary-input"
              aria-label="Summary"
              variant="borderless"
              className={styles.summaryInput}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={typeConfig.subjectPlaceholder}
              maxLength={200}
              disabled={submitting}
              autoFocus
            />
            {subject.length > 0 && (
              <span className={styles.summaryCount}>{subject.length}/200</span>
            )}
          </div>

          <div className={styles.composerDetailsWrap}>
            <Input.TextArea
              id="feedback-details-input"
              aria-label="Details"
              variant="borderless"
              className={styles.detailsInput}
              autoSize={{ minRows: 4, maxRows: 7 }}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={typeConfig.detailsPlaceholder}
              maxLength={10000}
              disabled={submitting}
            />
            {!details.trim() && (
              <Tooltip title="Insert structured writing prompt">
                <button
                  type="button"
                  className={styles.promptChip}
                  disabled={submitting}
                  onClick={handleInsertTemplate}
                >
                  <Sparkles size={11} aria-hidden="true" />
                  <span>Insert template</span>
                </button>
              </Tooltip>
            )}
          </div>

          {/* Compact Attachment Filmstrip (renders only when files are attached) */}
          {attachments.length > 0 && (
            <div className={styles.attachmentStrip} aria-label="Attached files">
              {attachments.map((item) => (
                <div key={item.id} className={styles.attachmentChip} title={item.file.name}>
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className={styles.attachmentThumbMini}
                    />
                  ) : (
                    <span className={styles.attachmentIconBox} aria-hidden="true">
                      <FileText size={14} />
                    </span>
                  )}
                  <div className={styles.attachmentMeta}>
                    <span className={styles.attachmentFileName}>{item.file.name}</span>
                    <span className={styles.attachmentFileSize}>
                      {formatFileSize(item.file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.removeAttachmentBtn}
                    aria-label={`Remove ${item.file.name}`}
                    disabled={submitting}
                    onClick={() => removeAttachment(item.id)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Single-Row Inline Composer Toolbar */}
          <div className={styles.composerToolbar}>
            <div className={styles.toolbarGroup}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={SUPPORT_ATTACHMENT_ACCEPT}
                style={{ display: 'none' }}
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
              />
              <Tooltip title="Attach files, drag & drop, or paste screenshot (Ctrl+V)">
                <button
                  type="button"
                  className={`${styles.toolbarChipBtn} ${attachments.length > 0 ? styles.toolbarChipActive : ''}`}
                  disabled={submitting || attachments.length >= FEEDBACK_MAX_ATTACHMENTS}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={13} aria-hidden="true" />
                  <span>
                    Attach {attachments.length > 0 ? `(${attachments.length}/${FEEDBACK_MAX_ATTACHMENTS})` : ''}
                  </span>
                </button>
              </Tooltip>

              <Select<number>
                size="small"
                aria-label="Category"
                placeholder="Category"
                className={styles.toolbarSelect}
                popupMatchSelectWidth={false}
                loading={categoriesLoading}
                value={effectiveCategoryId}
                onChange={(val) => setCategoryId(val ?? null)}
                options={categoryOptions}
                disabled={submitting}
              />

              <Select<number>
                size="small"
                aria-label="Priority"
                placeholder="Priority: Auto"
                allowClear
                className={styles.toolbarSelect}
                popupMatchSelectWidth={false}
                loading={prioritiesLoading}
                value={priorityId ?? undefined}
                onChange={(val) => setPriorityId(val ?? null)}
                options={priorityOptions}
                disabled={submitting}
              />
            </div>

            <Tooltip title={diagnosticsTooltip}>
              <button
                type="button"
                aria-pressed={includeContext}
                className={`${styles.toolbarChipBtn} ${includeContext ? styles.toolbarChipActive : ''}`}
                disabled={submitting}
                onClick={() => setIncludeContext((prev) => !prev)}
              >
                <Monitor size={13} aria-hidden="true" />
                <span className={styles.diagPath}>
                  {includeContext ? pagePath || 'Diagnostics' : 'No context'}
                </span>
              </button>
            </Tooltip>
          </div>

          {isDraggingFiles && (
            <div className={styles.dropOverlay}>
              <Upload size={22} aria-hidden="true" />
              <span>Drop up to {FEEDBACK_MAX_ATTACHMENTS} files to attach</span>
            </div>
          )}
        </div>

        {/* Compact Single-Row Footer */}
        <div className={styles.modalFooter}>
          <span className={styles.footerMeta}>
            <ShieldAlert size={13} aria-hidden="true" />
            <span>No sensitive data</span>
            <span>·</span>
            <kbd className={styles.kbdHint}>Ctrl+Enter</kbd>
          </span>

          <div className={styles.modalFooterActions}>
            <Link
              to="/support-tickets"
              className={styles.modalFooterLink}
              onClick={handleClose}
            >
              My tickets
            </Link>
            <Button size="middle" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="primary"
              size="middle"
              loading={submitting}
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              {activeMeta.shortSubmit}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
