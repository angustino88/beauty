import { Tooltip } from 'antd';
import { ArrowUpOutlined, CheckOutlined } from '@ant-design/icons';
import { StatusBadge } from '@/shared/components/StatusBadge';
import type { Assessment } from '../../utils/assessment';
import styles from './Assessment.module.css';

function PointList({ title, items, kind }: { title: string; items: string[]; kind: 'strength' | 'improve' }) {
  return (
    <div>
      <p className={styles.listTitle}>{title}</p>
      {items.length ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item}>
              <span className={styles[kind]} aria-hidden="true">{kind === 'strength' ? <CheckOutlined /> : <ArrowUpOutlined />}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className={styles.empty}>{kind === 'strength' ? 'None stands out yet.' : 'Nothing to improve.'}</span>
      )}
    </div>
  );
}

function Rating({ assessment }: { assessment: Assessment }) {
  return (
    <span className={styles.ratingLine}>
      <StatusBadge tone={assessment.tone} label={assessment.label} fit />
      {assessment.score != null ? <span className={styles.score}>{assessment.score}/100</span> : null}
    </span>
  );
}

/** Table cell: rating, the lead strength and the lead point to improve; the tooltip lists them all. */
export function AssessmentCell({ assessment }: { assessment: Assessment }) {
  const [strength] = assessment.strengths;
  const [improve] = assessment.improvements;
  const hidden = Math.max(0, assessment.strengths.length - 1) + Math.max(0, assessment.improvements.length - 1);
  return (
    <Tooltip
      placement="right"
      styles={{ root: { maxWidth: 380 } }}
      title={(
        <div className={styles.tooltip}>
          <PointList title="Strengths" items={assessment.strengths} kind="strength" />
          <PointList title="To improve" items={assessment.improvements} kind="improve" />
        </div>
      )}
    >
      <div className={styles.cell}>
        <Rating assessment={assessment} />
        {strength ? (
          <span className={styles.point}><span className={styles.strength} aria-label="Strength"><CheckOutlined /></span><span>{strength}</span></span>
        ) : null}
        {improve ? (
          <span className={styles.point}><span className={styles.improve} aria-label="To improve"><ArrowUpOutlined /></span><span>{improve}</span></span>
        ) : null}
        {hidden > 0 ? <span className={styles.more}>+{hidden} more</span> : null}
      </div>
    </Tooltip>
  );
}

/** Detail view: the full assessment. */
export function AssessmentPanel({ assessment }: { assessment: Assessment }) {
  return (
    <section className={styles.panel} aria-label="KPI assessment">
      <div className={styles.panelHeader}>
        <h4 className={styles.panelTitle}>KPI assessment</h4>
        <Rating assessment={assessment} />
      </div>
      <div className={styles.panelColumns}>
        <PointList title="Strengths" items={assessment.strengths} kind="strength" />
        <PointList title="To improve" items={assessment.improvements} kind="improve" />
      </div>
    </section>
  );
}
