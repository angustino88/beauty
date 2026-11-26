import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Modal, Select, Switch, Tooltip } from 'antd';
import {
  Bug,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
  LifeBuoy,
  MessageSquare,
  Monitor,
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
  SUPPORT_ATTACHMENT_HINT,
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

function PillIcon({ pillKey }: { pillKey: FeedbackPillKey }): ReactNode {
  switch (pillKey) {
    case 'support':
      return <LifeBuoy size={15} aria-hidden="true" />;
    case 'bug':
      return <Bug size={15} aria-hidden="true" />;
    case 'feature':
      return <Layers size={15} aria-hidden="true" />;
    case 'feedback':
      return <MessageSquare size={15} aria-hidden="true" />;
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

  const [selectedType, setSelectedType] = useState<FeedbackPillKey>(initialType);
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
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
    { skip: !open || !showMoreOptions },
  );

  const typeConfig = getFeedbackTypeConfig(selectedType);
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
    setShowMoreOptions(false);
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
          // Give unnamed clipboard screenshots a clean timestamped filename
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

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
    if (submitting) return;
    const dropped = Array.from(event.dataTransfer.files ?? []);
    addFiles(dropped);
  };

  const handleInsertTemplate = () => {
    if (!details.trim()) {
      setDetails(typeConfig.detailsTemplate);
      return;
    }
    setDetails((prev) => `${prev.trimEnd()}\n\n${typeConfig.detailsTemplate}`);
  };

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedDetails = details.trim();
    if (!trimmedSubject) {
      setFormError('Please enter a short summary.');
      return;
    }
    if (!trimmedDetails) {
      setFormError('Please provide details before submitting.');
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
          description: 'Tracked in Support Tickets so you can follow progress and replies.',
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

  const contextPreview = useMemo(() => {
    const parts: string[] = [];
    if (pagePath) parts.push(pagePath);
    if (clientContext.browser) parts.push(clientContext.browser);
    if (clientContext.os) parts.push(clientContext.os);
    if (clientContext.viewport) parts.push(clientContext.viewport);
    if (clientContext.theme) parts.push(`${clientContext.theme} theme`);
    return parts.join(' · ') || 'No diagnostics detected';
  }, [pagePath, clientContext]);

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
      width={620}
      destroyOnHidden
      closable={!submitting}
      keyboard={!submitting}
      mask={{ closable: !submitting }}
      style={{ top: 32 }}
      styles={{ body: { maxHeight: 'calc(100dvh - 120px)', overflowY: 'auto' } }}
      title={
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Support &amp; Feedback</h2>
          <p className={styles.modalSubtitle}>
            Get help or provide feedback about the platform
          </p>
        </div>
      }
    >
      <div className={styles.formBody} onPaste={handlePaste}>
        {formError && (
          <InlineAlert
            variant="error"
            title="Could not submit"
            description={formError}
          />
        )}

        {/* Type selector pills */}
        <div className={styles.sectionBlock}>
          <span id="feedback-type-label" className={styles.sectionLabel}>
            Type
          </span>
          <div
            className={styles.typePillGroup}
            role="radiogroup"
            aria-labelledby="feedback-type-label"
          >
            {FEEDBACK_TYPE_CONFIGS.map((cfg) => {
              const isActive = cfg.key === selectedType;
              return (
                <button
                  key={cfg.key}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  disabled={submitting}
                  className={`${styles.typePill} ${isActive ? styles.typePillActive : ''}`}
                  onClick={() => setSelectedType(cfg.key)}
                >
                  <PillIcon pillKey={cfg.key} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
          <span className={styles.typeHint}>{typeConfig.description}</span>
        </div>

        {/* Summary */}
        <div className={styles.sectionBlock}>
          <label htmlFor="feedback-summary-input" className={styles.sectionLabel}>
            Summary
          </label>
          <Input
            id="feedback-summary-input"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={typeConfig.subjectPlaceholder}
            maxLength={200}
            showCount
            disabled={submitting}
            autoFocus
          />
        </div>

        {/* Details */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionLabelRow}>
            <label htmlFor="feedback-details-input" className={styles.sectionLabel}>
              Details
            </label>
            <button
              type="button"
              className={styles.templateBtn}
              disabled={submitting}
              onClick={handleInsertTemplate}
            >
              Insert template
            </button>
          </div>
          <Input.TextArea
            id="feedback-details-input"
            rows={5}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder={typeConfig.detailsPlaceholder}
            maxLength={10000}
            disabled={submitting}
          />
          <span className={styles.privacyHint}>
            Please don&apos;t include sensitive information (password, personal data, etc.)
          </span>
        </div>

        {/* Attachments (0/5) */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionLabelRow}>
            <span className={styles.sectionLabel}>
              Attachments ({attachments.length}/{FEEDBACK_MAX_ATTACHMENTS})
            </span>
            <span className={styles.typeHint}>Drop files or paste screenshot (Ctrl+V)</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={SUPPORT_ATTACHMENT_ACCEPT}
            style={{ display: 'none' }}
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              addFiles(selected);
              event.target.value = '';
            }}
          />

          <div
            className={`${styles.attachmentsDropzone} ${isDraggingFiles ? styles.attachmentsDropzoneActive : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingFiles(true);
            }}
            onDragLeave={() => setIsDraggingFiles(false)}
            onDrop={handleDrop}
          >
            {attachments.map((item) => (
              <div key={item.id} className={styles.attachmentTile} title={item.file.name}>
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className={styles.attachmentThumb}
                  />
                ) : (
                  <>
                    <FileText size={20} className={styles.attachmentFileIcon} aria-hidden="true" />
                    <span className={styles.attachmentFileName}>{item.file.name}</span>
                    <span className={styles.attachmentFileSize}>
                      {formatFileSize(item.file.size)}
                    </span>
                  </>
                )}
                <Tooltip title={`Remove ${item.file.name}`}>
                  <button
                    type="button"
                    className={styles.removeAttachmentBtn}
                    aria-label={`Remove ${item.file.name}`}
                    disabled={submitting}
                    onClick={() => removeAttachment(item.id)}
                  >
                    <X size={12} />
                  </button>
                </Tooltip>
              </div>
            ))}

            {attachments.length < FEEDBACK_MAX_ATTACHMENTS && (
              <button
                type="button"
                className={styles.uploadTile}
                disabled={submitting}
                aria-label="Upload attachment"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={18} aria-hidden="true" />
                <span className={styles.uploadTileLabel}>Upload</span>
              </button>
            )}
          </div>
          <span className={styles.privacyHint}>{SUPPORT_ATTACHMENT_HINT}</span>
        </div>

        {/* Transparent page & browser diagnostics */}
        <div className={styles.contextStrip}>
          <div className={styles.contextMeta}>
            <span className={styles.contextHeading}>
              <Monitor size={13} aria-hidden="true" />
              <span>Include page &amp; browser diagnostics</span>
            </span>
            <span className={styles.contextSummary} title={contextPreview}>
              {includeContext ? contextPreview : 'Diagnostics excluded from this submission'}
            </span>
          </div>
          <Switch
            size="small"
            checked={includeContext}
            onChange={setIncludeContext}
            disabled={submitting}
            aria-label="Include page and browser diagnostics"
          />
        </div>

        {/* Optional routing overrides */}
        <button
          type="button"
          className={styles.moreToggle}
          onClick={() => setShowMoreOptions((prev) => !prev)}
          aria-expanded={showMoreOptions}
        >
          {showMoreOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>More options (category &amp; priority)</span>
        </button>

        {showMoreOptions && (
          <div className={styles.moreGrid}>
            <div className={styles.sectionBlock}>
              <span className={styles.sectionLabel}>Category</span>
              <Select<number>
                aria-label="Ticket category"
                placeholder="Auto-selected"
                allowClear
                loading={categoriesLoading}
                value={effectiveCategoryId}
                onChange={(val) => setCategoryId(val ?? null)}
                options={categoryOptions}
                showSearch={{ optionFilterProp: 'label' }}
                disabled={submitting}
              />
            </div>
            <div className={styles.sectionBlock}>
              <span className={styles.sectionLabel}>Priority</span>
              <Select<number>
                aria-label="Ticket priority"
                placeholder="Default priority"
                allowClear
                loading={prioritiesLoading}
                value={priorityId ?? undefined}
                onChange={(val) => setPriorityId(val ?? null)}
                options={priorityOptions}
                showSearch={{ optionFilterProp: 'searchLabel' }}
                disabled={submitting}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.modalFooter}>
          <Link
            to="/support-tickets"
            className={styles.modalFooterLink}
            onClick={handleClose}
          >
            View my tickets &rarr;
          </Link>
          <div className={styles.modalFooterActions}>
            <Button onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={!subject.trim() || !details.trim()}
              onClick={() => void handleSubmit()}
            >
              {typeConfig.submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
