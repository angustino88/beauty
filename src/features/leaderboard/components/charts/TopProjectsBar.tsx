import { ProjectOutlined } from '@ant-design/icons';
import type { TopProjectItem } from '../../types';
import styles from './TopProjectsBar.module.css';

interface TopProjectsBarProps {
  data?: TopProjectItem[];
}

const HEAT_COLORS = [
  '#fafafa', '#ede7f6', '#d1c4e9', '#b39ddb', '#7e57c2', '#512da8', '#311b92',
];
const HEAT_TEXT = ['#9e9e9e', '#6a4fa3', '#4a3480', '#fff', '#fff', '#fff', '#fff'];
const HEAT_BORDER = [
  '#e0e0e0', '#c5b3e6', '#a890d4', '#8c6dbf', '#6840b5', '#3f1f96', '#27116e',
];

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
