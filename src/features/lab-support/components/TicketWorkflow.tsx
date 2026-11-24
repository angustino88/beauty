import { useState } from 'react';
import { Button, Dropdown, Form, Input, Modal, Select } from 'antd';
import { ArrowRightOutlined, DownOutlined, SwapOutlined } from '@ant-design/icons';
import { InlineAlert, notify } from '@/shared/notifications';
import {
  useSupportTicketsActionsTransitionCreateByKeyMutation,
  type AvailableTicketTransitionRead,
  type ResolutionCodeEnum,
  type TicketDetailRead,
} from '@/shared/api/generated/api';
import { apiErrorMessage } from '../attachments';
import { getResolutionOptions, getWorkflowAction } from '../ticketPresentation';
import { isTicketVersionConflict, type RunTicketWrite } from '../ticketWriteQueue';
import { TicketStatusBadge } from './TicketBadges';
import styles from './SupportTickets.module.css';

interface TransitionDraft {
  target: AvailableTicketTransitionRead;
  fromStatusId: number;
  ticketType: string;
  note: string;
  outcome?: ResolutionCodeEnum;
  summary: string;
  rootCause: string;
}

export function TicketWorkflow({ ticket, runTicketWrite, isSaving }: {
  ticket: TicketDetailRead;
  runTicketWrite: RunTicketWrite;
  isSaving: boolean;
}) {
  const [draft, setDraft] = useState<TransitionDraft | null>(null);
  const [error, setError] = useState('');
  const [transition] = useSupportTicketsActionsTransitionCreateByKeyMutation();
  const currentState = ticket.status_system_state?.value;
  const ticketType = ticket.ticket_type?.value ?? 'service_request';
  const isTechnical = ticketType === 'incident' || ticketType === 'problem';
  const choices = ticket.available_transitions ?? [];
  const actionLabel = draft ? getWorkflowAction(draft.target, currentState) : 'Change status';

  const begin = (target: AvailableTicketTransitionRead) => {
    if (ticket.version === undefined) return;
    setError('');
    setDraft({ target, fromStatusId: ticket.status.id, ticketType, note: '', summary: '', rootCause: '' });
  };

  const updateDraft = (update: Partial<TransitionDraft>) => {
    setDraft((current) => current ? { ...current, ...update } : current);
  };

  const save = async () => {
    if (!draft || isSaving) return;
    setError('');
    try {
      await runTicketWrite('status', async (current, version) => {
        const target = current.available_transitions?.find(({ id }) => id === draft.target.id);
        if (
          current.status.id !== draft.fromStatusId ||
          current.ticket_type.value !== draft.ticketType ||
          !target ||
          target.is_reason_required !== draft.target.is_reason_required ||
          target.is_resolution_required !== draft.target.is_resolution_required
        ) {
          throw new Error('The ticket workflow changed. Cancel and choose the status again.');
        }
        const response = await transition({
          key: current.key,
          ticketTransitionRequest: {
            to_status_id: target.status.id,
            version,
            reason: draft.note.trim() || undefined,
            resolution_code: target.is_resolution_required ? draft.outcome : undefined,
            resolution_summary: target.is_resolution_required ? draft.summary.trim() : undefined,
            root_cause: isTechnical && target.is_resolution_required ? draft.rootCause.trim() || undefined : undefined,
          },
        }).unwrap();
        return response.data;
      });
      setDraft(null);
      notify.success(`Status updated to ${draft.target.status.name}`);
    } catch (failure) {
      setError(isTicketVersionConflict(failure)
        ? 'The ticket changed while you were editing. Review the current ticket before trying again.'
        : apiErrorMessage(failure, 'Please review the status change and try again.'));
    }
  };

  if (!choices.length && !draft) return null;

  return (
    <>
      {!!choices.length && (
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: choices.map((target) => ({
              key: target.id,
              label: getWorkflowAction(target, currentState),
              danger: target.is_final,
              onClick: () => begin(target),
            })),
          }}
        >
          <Button type="primary" icon={<SwapOutlined />} disabled={ticket.version === undefined || isSaving}>
            Change status <DownOutlined className={styles.workflowChevron} />
          </Button>
        </Dropdown>
      )}

      <Modal
        title={actionLabel}
        open={draft !== null}
        onCancel={() => setDraft(null)}
        confirmLoading={isSaving}
        closable={!isSaving}
        keyboard={!isSaving}
        mask={{ closable: !isSaving }}
        cancelButtonProps={{ disabled: isSaving }}
        okText={actionLabel}
        okButtonProps={{
          danger: draft?.target.is_final,
          disabled: Boolean(draft && (
            (draft.target.is_reason_required && !draft.note.trim()) ||
            (draft.target.is_resolution_required && (!draft.outcome || !draft.summary.trim()))
          )),
        }}
        onOk={() => void save()}
        destroyOnHidden
      >
        {draft && (
          <>
            <div className={styles.workflowPreview} aria-label="Current and next status">
              <TicketStatusBadge status={ticket.status} systemState={currentState} isFinal={ticket.is_status_final} showTooltip={false} />
              <ArrowRightOutlined />
              <TicketStatusBadge status={draft.target.status} systemState={draft.target.system_state.value} isFinal={draft.target.is_final} showTooltip={false} />
            </div>
            {draft.target.is_sla_paused && <p className={styles.workflowHint}>This status pauses any active SLA clocks.</p>}
            {currentState === 'open' && draft.target.system_state.value === 'active' && !ticket.assignee && (
              <p className={styles.workflowHint}>Support staff who start work on an unassigned ticket become its assignee.</p>
            )}
            {error && <InlineAlert variant="error" title="Could not change status" description={error} />}
            <Form layout="vertical" className={styles.transitionForm} disabled={isSaving}>
              {draft.target.is_resolution_required && (
                <>
                  <Form.Item label="Outcome" required>
                    <Select<ResolutionCodeEnum>
                      aria-label="Outcome"
                      placeholder="Select the ticket outcome"
                      value={draft.outcome}
                      options={getResolutionOptions(ticketType)}
                      onChange={(outcome) => updateDraft({ outcome })}
                    />
                  </Form.Item>
                  <Form.Item label={isTechnical ? 'Resolution summary' : 'Outcome summary'} required>
                    <Input.TextArea
                      aria-label={isTechnical ? 'Resolution summary' : 'Outcome summary'}
                      rows={4}
                      value={draft.summary}
                      onChange={(event) => updateDraft({ summary: event.target.value })}
                      placeholder={isTechnical ? 'Describe the fix, workaround, or investigation result.' : 'Describe what was delivered, answered, or decided.'}
                    />
                  </Form.Item>
                  {isTechnical && (
                    <Form.Item label="Root cause (optional)">
                      <Input.TextArea
                        aria-label="Root cause"
                        rows={2}
                        value={draft.rootCause}
                        onChange={(event) => updateDraft({ rootCause: event.target.value })}
                      />
                    </Form.Item>
                  )}
                </>
              )}
              <Form.Item
                label={draft.target.is_reason_required ? 'Reason' : 'Status note (optional)'}
                required={draft.target.is_reason_required}
              >
                <Input.TextArea
                  aria-label={draft.target.is_reason_required ? 'Reason' : 'Status note'}
                  rows={2}
                  value={draft.note}
                  onChange={(event) => updateDraft({ note: event.target.value })}
                  placeholder={draft.target.is_reopen ? 'What needs more work?' : 'Add context for the ticket history.'}
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </>
  );
}
