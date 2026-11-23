import { Progress, Skeleton } from 'antd';
import { InlineAlert } from '@/shared/notifications';
import { CheckCircleFilled, ExclamationCircleFilled, LockOutlined, WarningFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { StatusBadge } from '@/shared/components/StatusBadge';
import type { StatusTone } from '@/shared/status/statusTone';
import type { LeaderboardAssessment } from '../../types';
import { AssessmentRadar } from './AssessmentRadar';
import { KpiBulletList } from './KpiBulletList';
import styles from './Assessment.module.css';

const RATING_TONE: Record<string, StatusTone> = {
  exceeds: 'success', meets: 'info', partially_meets: 'warning', below: 'danger', insufficient_data: 'neutral',
};
const DIAL_COLOR: Record<string, string> = {
  exceeds: 'var(--lm-success-solid)',
  meets: 'var(--lm-info-solid)',
  partially_meets: 'var(--lm-warning-solid)',
  below: 'var(--lm-danger-solid)',
};
const VISIBILITY = {
  self: 'Visible to you, lab coordinators and admins',
  user: 'Visible to this user, lab coordinators and admins',
  bench: 'Visible to lab coordinators and admins only',
} as const;

export type AssessmentAudience = keyof typeof VISIBILITY;

function period(range: { starts_at: string; ends_at: string }) {
  const start = dayjs(range.starts_at);
  const end = dayjs(range.ends_at);
  return start.isSame(end, 'year')
    ? `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`
    : `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`;
}

function ScorePanel({ assessment }: { assessment: LeaderboardAssessment }) {
  const rated = assessment.rating.value !== 'insufficient_data';
  return (
    <div className={styles.scorePanel}>
      <Progress
        type="dashboard"
        size={132}
        strokeWidth={8}
        percent={assessment.score ?? 0}
        strokeColor={DIAL_COLOR[assessment.rating.value] ?? 'var(--lm-border)'}
        format={() => (
          <span className={styles.dialValue}>
            {assessment.score ?? '—'}
            <small>{assessment.score != null ? 'of 100' : 'no score'}</small>
          </span>
        )}
      />
      <StatusBadge tone={RATING_TONE[assessment.rating.value] ?? 'neutral'} label={assessment.rating.label} fit />
      <p className={styles.summary}>{assessment.summary}</p>
      <dl className={styles.evidence}>
        <div><dt>Sessions</dt><dd>{assessment.total_sessions}</dd></div>
        <div><dt>Bookings</dt><dd>{assessment.total_bookings}</dd></div>
        {rated && <div><dt>Strengths</dt><dd>{assessment.strengths.length}</dd></div>}
        {rated && <div><dt>To develop</dt><dd>{assessment.development_areas.length}</dd></div>}
      </dl>
    </div>
  );
}

function Findings({ assessment }: { assessment: LeaderboardAssessment }) {
  return (
    <div className={styles.findings}>
      <section className={styles.card}>
        <h5 className={styles.sectionTitle}>Strengths</h5>
        {assessment.strengths.length ? (
          <ul className={styles.list}>
            {assessment.strengths.map((item) => (
              <li key={item.kpi.value} className={styles.item}>
                <CheckCircleFilled className={`${styles.itemIcon} ${styles.good}`} aria-hidden="true" />
                <span><span className={styles.itemKpi}>{item.kpi.label}</span>{item.text}</span>
              </li>
            ))}
          </ul>
        ) : <span className={styles.empty}>No KPI is on target yet.</span>}
      </section>
      <section className={styles.card}>
        <h5 className={styles.sectionTitle}>Development areas</h5>
        {assessment.development_areas.length ? (
          <ul className={styles.list}>
            {assessment.development_areas.map((item) => {
              const below = item.severity.value === 'below';
              const Icon = below ? WarningFilled : ExclamationCircleFilled;
              return (
                <li key={item.kpi.value} className={styles.item}>
                  <Icon className={`${styles.itemIcon} ${below ? styles.below : styles.near}`} aria-label={item.severity.label} />
                  <span>
                    <span className={styles.itemKpi}>{item.kpi.label} · {item.severity.label.toLowerCase()}</span>
                    {item.text}
                    <span className={styles.recommendation}><strong>Recommendation:</strong> {item.recommendation}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : <span className={styles.empty}>Every KPI is on target.</span>}
      </section>
    </div>
  );
}

interface AssessmentReportProps {
  assessment?: LeaderboardAssessment;
  loading: boolean;
  error: boolean;
  audience: AssessmentAudience;
}

/** The KPI assessment tab of the user or bench profile. */
export function AssessmentReport({ assessment, loading, error, audience }: AssessmentReportProps) {
  if (loading && !assessment) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (error && !assessment) {
    return (
      <InlineAlert
        variant="error"
        title="Unable to load assessment"
        description="Please try again later."
      />
    );
  }
  if (!assessment) return null;
  const rated = assessment.rating.value !== 'insufficient_data';

  return (
    <div className={styles.report}>
      <div className={styles.reportMeta}>
        <span>{period(assessment.period)} · compared with the previous {dayjs(assessment.period.ends_at).diff(assessment.period.starts_at, 'day') + 1} days</span>
        <span className={styles.restricted}><LockOutlined aria-hidden="true" /> {VISIBILITY[audience]}</span>
      </div>

      <div className={styles.overview}>
        <ScorePanel assessment={assessment} />
        {rated && <AssessmentRadar kpis={assessment.kpis} />}
      </div>

      {rated && (
        <>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h5 className={styles.sectionTitle}>KPI scorecard</h5>
              <span className={styles.cardNote}>A full bar means the target is reached</span>
            </div>
            <KpiBulletList kpis={assessment.kpis} />
          </section>
          <Findings assessment={assessment} />
        </>
      )}
    </div>
  );
}
