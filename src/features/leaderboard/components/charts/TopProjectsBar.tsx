import { ProjectOutlined } from '@ant-design/icons';
import type { TopProjectItem } from '../../types';
import styles from './TopProjectsBar.module.css';

interface TopProjectsBarProps {
  data?: TopProjectItem[];
}

// Theme-aware ramp: empty cells use the muted surface, then mix toward the chart violet.
const HEAT_COLORS = [0, 16, 30, 46, 64, 82, 100].map((pct) => (pct === 0
  ? 'var(--lm-surface-muted)'
  : `color-mix(in srgb, var(--lm-chart-6) ${pct}%, var(--lm-surface-muted))`));
const HEAT_TEXT = ['var(--lm-text-tertiary)', 'var(--lm-text-secondary)', 'var(--lm-text)', '#fff', '#fff', '#fff', '#fff'];
const HEAT_BORDER = HEAT_COLORS.map((color, index) => (index === 0 ? 'var(--lm-border)' : color));

function heatIndex(minutes: number, totalMinutes: number): number {
  if (minutes === 0 || totalMinutes === 0) return 0;
  const ratio = minutes / totalMinutes;
  if (ratio < 0.08) return 1;
  if (ratio < 0.2)  return 2;
  if (ratio < 0.35) return 3;
  if (ratio < 0.55) return 4;
  if (ratio < 0.75) return 5;
  return 6;
}

export function TopProjectsBar({ data }: TopProjectsBarProps) {
  if (!data || data.length === 0) return null;

  const totalMinutes = data.reduce((sum, p) => sum + p.total_minutes, 0);

  return (
    <div className={styles.container}>
      <div className={styles.icon}><ProjectOutlined /></div>
      <div className={styles.content}>
        <div className={styles.label}>Top Projects</div>
        <div className={styles.list}>
          {data.map((project) => {
            const idx = heatIndex(project.total_minutes, totalMinutes);
            const hours = (project.total_minutes / 60).toFixed(1);
            return (
              <span
                key={project.project_id}
                className={styles.tag}
                style={{ backgroundColor: HEAT_COLORS[idx], color: HEAT_TEXT[idx], borderColor: HEAT_BORDER[idx] }}
                title={`${hours}h`}
              >
                {project.project_name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
