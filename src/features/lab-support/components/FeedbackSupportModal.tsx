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
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Modal, Tooltip } from 'antd';
import {
  Bug,
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
  type FeedbackPillKey,
} from '../feedbackContext';
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

function TypeIcon({ pillKey }: { pillKey: FeedbackPillKey }): ReactNode {
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
  initialType = 'support',
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
  const [attachments, setAttachments] = useState<AttachedItem[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createTicket] = useCreateSupportTicketMutation();
  const [uploadAttachment] = useUploadSupportAttachmentMutation();

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

  const canSubmit = Boolean(subject.trim() && details.trim()) && !submitting;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canSubmit) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedDetails = details.trim();
    if (!trimmedSubject) {
      setFormError('Please enter a subject.');
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

  const diagnosticsTooltip = useMemo(() => {
    const parts: string[] = [];
    if (pagePath) parts.push(`Page: ${pagePath}`);
    if (clientContext.browser) parts.push(clientContext.browser);
    if (clientContext.os) parts.push(clientContext.os);
    if (clientContext.viewport) parts.push(clientContext.viewport);
    if (clientContext.theme) parts.push(`${clientContext.theme} theme`);
    const summary = parts.join(' · ') || 'No diagnostics detected';
    return includeContext
      ? `Diagnostics attached (${summary}). Click to exclude.`
      : 'Diagnostics excluded. Click to include page & browser info.';
  }, [includeContext, pagePath, clientContext]);

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={512}
      centered
      destroyOnHidden
      closable={!submitting}
      keyboard={!submitting}
      mask={{ closable: !submitting }}
      title={
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Support &amp; Feedback</h2>
          <p className={styles.modalSubtitle}>
            Get help or provide feedback about the platform
          </p>
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

        {/* Type */}
        <div className={styles.fieldGroup}>
          <span id="feedback-type-label" className={styles.fieldLabel}>
            Type
          </span>
          <div
            className={styles.typeTrack}
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
                  className={`${styles.typeOption} ${isActive ? styles.typeOptionActive : ''}`}
                  onClick={() => setSelectedType(cfg.key)}
                >
                  <TypeIcon pillKey={cfg.key} />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabelRow}>
            <label htmlFor="feedback-summary-input" className={styles.fieldLabel}>
              Subject
            </label>
            {subject.length > 160 && (
              <span className={styles.fieldMutedNote}>{subject.length}/200</span>
            )}
          </div>
          <Input
            id="feedback-summary-input"
            size="large"
            className={styles.textInput}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={typeConfig.subjectPlaceholder}
            maxLength={200}
            disabled={submitting}
            autoFocus
          />
        </div>

        {/* Details */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabelRow}>
            <label htmlFor="feedback-details-input" className={styles.fieldLabel}>
              Details
            </label>
            {!details.trim() && (
              <button
                type="button"
                className={styles.fieldActionLink}
                disabled={submitting}
                onClick={() => setDetails(typeConfig.detailsTemplate)}
              >
                Use template
              </button>
            )}
          </div>
          <Input.TextArea
            id="feedback-details-input"
            className={styles.detailsArea}
            autoSize={{ minRows: 4, maxRows: 7 }}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={typeConfig.detailsPlaceholder}
            maxLength={10000}
            disabled={submitting}
          />
          <span className={styles.fieldMutedNote}>
            Please don&apos;t include sensitive information (password, personal data, etc.)
          </span>
        </div>

        {/* Attachments (0/5) */}
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabelRow}>
            <span className={styles.fieldLabel}>
              Attachments ({attachments.length}/{FEEDBACK_MAX_ATTACHMENTS})
            </span>
            <span className={styles.fieldMutedNote}>Drop or paste (Ctrl+V)</span>
          </div>

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

          <div className={styles.attachmentsRow}>
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
                    <FileText size={18} className={styles.attachmentFileIcon} aria-hidden="true" />
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
                    <X size={11} />
                  </button>
                </Tooltip>
              </div>
            ))}

            {attachments.length < FEEDBACK_MAX_ATTACHMENTS && (
              <Tooltip title={SUPPORT_ATTACHMENT_HINT}>
                <button
                  type="button"
                  className={styles.uploadSlot}
                  disabled={submitting}
                  aria-label="Upload attachment"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={18} aria-hidden="true" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <Tooltip title={diagnosticsTooltip}>
            <button
              type="button"
              aria-pressed={includeContext}
              disabled={submitting}
              className={`${styles.contextToggleBtn} ${includeContext ? styles.contextToggleActive : ''}`}
              onClick={() => setIncludeContext((prev) => !prev)}
            >
              <Monitor size={13} aria-hidden="true" />
              <span className={styles.contextPathText}>
                {includeContext ? pagePath || 'Diagnostics on' : 'Diagnostics off'}
              </span>
            </button>
          </Tooltip>

          <div className={styles.modalFooterActions}>
            <Button onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
            >
              Submit
            </Button>
          </div>
        </div>

        {isDraggingFiles && (
          <div className={styles.dropOverlay}>
            <Upload size={22} aria-hidden="true" />
            <span>Drop up to {FEEDBACK_MAX_ATTACHMENTS} files to attach</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
