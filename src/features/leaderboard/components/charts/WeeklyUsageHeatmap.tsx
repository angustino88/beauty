import { Skeleton } from 'antd';
import type { WeeklyUsageItem } from '../../types';
import styles from './WeeklyUsageHeatmap.module.css';

interface WeeklyUsageHeatmapProps {
  data: WeeklyUsageItem[];
  loading?: boolean;
}

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun',
};

const HEAT_COLORS = [
  '#fafafa', '#f3e8ff', '#ddb6f8', '#bb86ef', '#9c27b0', '#6a1b9a', '#3d0066',
];
const HEAT_TEXT  = ['#9e9e9e', '#7b3fa0', '#5c1a80', '#fff', '#fff', '#fff', '#fff'];
const HEAT_LABEL = [
  '#bdbdbd', '#c48ee0', '#9c4fcb',
  'rgba(255,255,255,0.82)', 'rgba(255,255,255,0.78)',
  'rgba(255,255,255,0.75)', 'rgba(255,255,255,0.70)',
];

function heatIndex(hours: number, maxHours: number): number {
  if (hours === 0 || maxHours === 0) return 0;
  const ratio = hours / maxHours;
  if (ratio < 0.08) return 1;
  if (ratio < 0.2)  return 2;
  if (ratio < 0.35) return 3;
  if (ratio < 0.55) return 4;
  if (ratio < 0.75) return 5;
  return 6;
}

function buildWeekMap(data: WeeklyUsageItem[]): Record<number, number> {
  const map: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  data.forEach((item) => {
    if (item.weekday >= 1 && item.weekday <= 7) {
      map[item.weekday] = Math.round((item.total_minutes || 0) / 60 * 10) / 10;
    }
  });
  return map;
}

export function WeeklyUsageHeatmap({ data, loading }: WeeklyUsageHeatmapProps) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.title}>Weekly Usage (hours)</div>
        <div className={styles.loading}>
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton.Input key={i} active block style={{ height: 66 }} />
          ))}
        </div>
      </div>
    );
  }

  const weekMap = buildWeekMap(data);
  const maxHours = Math.max(...Object.values(weekMap));

  return (
    <div className={styles.container}>
      <div className={styles.title}>Weekly Usage (hours)</div>
      <div className={styles.grid}>
        {Object.entries(WEEKDAY_LABELS).map(([weekday, label]) => {
          const day = Number(weekday);
          const hours = weekMap[day];
          const idx = heatIndex(hours, maxHours);
          return (
            <div key={weekday} className={styles.cell} style={{ backgroundColor: HEAT_COLORS[idx] }}>
              <span className={styles.weekday} style={{ color: HEAT_LABEL[idx] }}>{label}</span>
              <span className={styles.value} style={{ color: HEAT_TEXT[idx] }}>{hours}h</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
