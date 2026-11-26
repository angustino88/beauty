import { useState } from 'react';
import { Button, Input, Rate, Typography } from 'antd';
import { useSupportTicketsActionsSubmitCsatCreateByKeyMutation } from '@/shared/api/generated/api';
import { notify } from '@/shared/notifications';
import { apiErrorMessage } from '../attachments';
import { CSAT_LABELS } from '../feedbackContext';
import styles from './FeedbackSupportModal.module.css';

interface TicketCsatCardProps {
  ticketKey: string;
  canSubmit: boolean;
  score?: number | null;
  comment?: string | null;
  submittedAt?: string | null;
  onSubmitted: () => void;
}

export function TicketCsatCard({
  ticketKey,
  canSubmit,
  score,
  comment,
  submittedAt,
  onSubmitted,
}: TicketCsatCardProps) {
  const hasExisting = typeof score === 'number' && score >= 1 && score <= 5;
  const [editing, setEditing] = useState(false);
  const [draftScore, setDraftScore] = useState<number>(score ?? 0);
  const [draftComment, setDraftComment] = useState<string>(comment ?? '');
  const [submitCsat, { isLoading }] = useSupportTicketsActionsSubmitCsatCreateByKeyMutation();

  if (!canSubmit && !hasExisting) {
    return null;
  }

  const isEditing = canSubmit && (!hasExisting || editing);

  const handleStartEdit = () => {
    setDraftScore(score ?? 0);
    setDraftComment(comment ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (draftScore < 1 || draftScore > 5) return;
    try {
      await submitCsat({
        key: ticketKey,
        csatRequest: {
          score: draftScore,
          comment: draftComment.trim(),
        },
      }).unwrap();
      notify.success(hasExisting ? 'Satisfaction rating updated' : 'Thank you for your feedback', {
        description: `Recorded ${draftScore}/5 for ${ticketKey}.`,
      });
      setEditing(false);
      onSubmitted();
    } catch (error: unknown) {
      notify.error('Unable to submit satisfaction rating', {
        description: apiErrorMessage(error, 'Please try again.'),
      });
    }
  };

  const activeScore = isEditing ? draftScore : (score ?? 0);
  const scoreLabel = activeScore >= 1 && activeScore <= 5 ? CSAT_LABELS[activeScore - 1] : '';

  return (
    <section className={styles.csatCard} aria-label="Support satisfaction rating">
      <div className={styles.csatHeader}>
        <div className={styles.csatTitleGroup}>
          <h3 className={styles.csatTitle}>
            {hasExisting ? 'Support satisfaction rating' : 'How was your support experience?'}
          </h3>
          <p className={styles.csatSubtitle}>
            {hasExisting
              ? submittedAt
                ? `Rated on ${new Date(submittedAt).toLocaleString()}`
                : 'Rating recorded for this ticket.'
              : 'Rate how well this request was handled to help the support team improve.'}
          </p>
        </div>

        {hasExisting && canSubmit && !isEditing && (
          <Button size="small" onClick={handleStartEdit}>
            Update rating
          </Button>
        )}
      </div>

      {isEditing ? (
        <>
          <div className={styles.csatRatingRow}>
            <Rate
              value={draftScore}
              onChange={setDraftScore}
              tooltips={[...CSAT_LABELS]}
              disabled={isLoading}
            />
            {scoreLabel && <span className={styles.csatScoreLabel}>{scoreLabel}</span>}
          </div>
          <Input.TextArea
            rows={2}
            maxLength={1000}
            showCount
            value={draftComment}
            onChange={(event) => setDraftComment(event.target.value)}
            placeholder="Optional comment about the resolution or response time…"
            disabled={isLoading}
          />
          <div className={styles.csatActions}>
            {hasExisting && (
              <Button
                size="small"
                disabled={isLoading}
                onClick={() => {
                  setDraftScore(score ?? 0);
                  setDraftComment(comment ?? '');
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="primary"
              size="small"
              loading={isLoading}
              disabled={draftScore < 1}
              onClick={() => void handleSave()}
            >
              {hasExisting ? 'Save rating' : 'Submit rating'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.csatRatingRow}>
            <Rate value={score ?? 0} disabled />
            {scoreLabel && (
              <Typography.Text strong style={{ fontSize: 13 }}>
                {score}/5 · {scoreLabel}
              </Typography.Text>
            )}
          </div>
          {comment?.trim() ? (
            <p className={styles.csatSummaryComment}>{comment.trim()}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
