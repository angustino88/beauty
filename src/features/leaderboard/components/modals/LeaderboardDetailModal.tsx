import {
  ClockCircleOutlined, DesktopOutlined, EnvironmentOutlined,
  FieldTimeOutlined, LineChartOutlined, RadarChartOutlined,
  TeamOutlined, UserOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Modal, Skeleton, Typography } from 'antd';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { getAvatarUrl } from '@/shared/utils/avatar';
import type {
  LeaderboardFilter, RankedLabItem,
  RankedPersonaItem, TopProjectItem, WeeklyUsageItem,
} from '../../types';
import {
  useLazyGetUserProfileQuery, useLazyGetUserWeeklyUsageQuery,
  useLazyGetLabProfileQuery, useLazyGetLabWeeklyUsageQuery,
} from '../../api';
import {
  toDateTime, toHours, toNumber, toPercent,
} from '../../formatters';
import { TopProjectsBar } from '../charts/TopProjectsBar';
import { WeeklyUsageHeatmap } from '../charts/WeeklyUsageHeatmap';
import styles from './LeaderboardDetailModal.module.css';

const { Text } = Typography;

interface Props {
  open: boolean;
  type: 'persona' | 'lab';
  userRow?: RankedPersonaItem | null;
  labRow?: RankedLabItem | null;
  filter: LeaderboardFilter;
  onClose: () => void;
}

interface MetricRowProps { icon: ReactNode; title: string; value: string; }

function MetricRow({ icon, title, value }: MetricRowProps) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricCardIcon}>{icon}</div>
      <div className={styles.metricCardContent}>
        <div className={styles.metricCardLabel}>{title}</div>
        <div className={styles.metricCardValue}>{value}</div>
      </div>
    </div>
  );
}

export function LeaderboardDetailModal({ open, type, userRow, labRow, filter, onClose }: Props) {
  const selectedId = type === 'persona' ? userRow?.id : labRow?.id;

  // Use local state (same as old FE) to avoid stale data flash between selections.
  // mounted flag prevents state updates after modal closes (race condition guard).
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyUsage, setWeeklyUsage] = useState<WeeklyUsageItem[]>([]);
  const [topProjects, setTopProjects] = useState<TopProjectItem[]>([]);

  const [fetchUserProfile]     = useLazyGetUserProfileQuery();
  const [fetchUserWeeklyUsage] = useLazyGetUserWeeklyUsageQuery();
  const [fetchLabProfile]      = useLazyGetLabProfileQuery();
  const [fetchLabWeeklyUsage]  = useLazyGetLabWeeklyUsageQuery();

  useEffect(() => {
    if (!open || !selectedId) return;

    let mounted = true;
    const arg = { id: selectedId, filter };

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (type === 'persona') {
          const [profileResult, usageResult] = await Promise.all([
            fetchUserProfile(arg).unwrap(),
            fetchUserWeeklyUsage(arg).unwrap(),
          ]);
          if (!mounted) return;
          setWeeklyUsage(usageResult);
          setTopProjects(profileResult.top_projects ?? []);
        } else {
          const [profileResult, usageResult] = await Promise.all([
            fetchLabProfile(arg).unwrap(),
            fetchLabWeeklyUsage(arg).unwrap(),
          ]);
          if (!mounted) return;
          setWeeklyUsage(usageResult);
          setTopProjects(profileResult.top_projects ?? []);
        }
      } catch {
        if (mounted) setError('Failed to load profile. Please try again.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [open, type, selectedId, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const avatarSrc = getAvatarUrl(userRow?.avatar ?? null, userRow?.username ?? null) ?? undefined;

  const personaMetrics = useMemo<MetricRowProps[]>(() => [
    { icon: <ClockCircleOutlined />, title: 'Last Remote',        value: toDateTime(userRow?.last_remote) },
    { icon: <TeamOutlined />,        title: 'Total Sessions',     value: toNumber(userRow?.total_sessions) },
    { icon: <LineChartOutlined />,   title: 'WFO',                value: toPercent(userRow?.wfo_rate) },
    { icon: <FieldTimeOutlined />,   title: 'Total Usage',        value: toHours(userRow?.total_usage_minutes != null ? userRow.total_usage_minutes / 60 : undefined) },
    { icon: <LineChartOutlined />,   title: 'WFH',                value: toPercent(userRow?.wfh_rate) },
    { icon: <FieldTimeOutlined />,   title: 'Avg Session',        value: toHours(userRow?.avg_session_minutes != null ? userRow.avg_session_minutes / 60 : undefined) },
    { icon: <FieldTimeOutlined />,   title: 'Work Late',          value: toPercent(userRow?.late_rate) },
    { icon: <FieldTimeOutlined />,   title: 'Longest Session',    value: toHours(userRow?.longest_session_minutes != null ? userRow.longest_session_minutes / 60 : undefined) },
    { icon: <EnvironmentOutlined />, title: 'Labs Accessed',      value: toNumber(userRow?.labs_accessed) },
    { icon: <RadarChartOutlined />,  title: 'Usage Efficiency',   value: toPercent(userRow?.usage_efficiency) },
    { icon: <DesktopOutlined />,     title: 'Booking Compliance', value: toPercent(userRow?.booking_compliance) },
  ], [userRow]);

  // The ranking row already carries these figures; the profile endpoint adds only the top projects.
  const labMetrics = useMemo<MetricRowProps[]>(() => [
    { icon: <ClockCircleOutlined />, title: 'Last Remote',        value: toDateTime(labRow?.last_remote) },
    { icon: <TeamOutlined />,        title: 'Total Sessions',     value: toNumber(labRow?.total_sessions) },
    { icon: <UserOutlined />,        title: 'Active Users',       value: toNumber(labRow?.active_users) },
    { icon: <FieldTimeOutlined />,   title: 'Downtime',           value: toHours(labRow?.downtime_hours) },
  ], [labRow]);

  const metrics = type === 'persona' ? personaMetrics : labMetrics;

  return (
    <Modal open={open} title={type === 'persona' ? 'User Profile' : 'Lab Profile'}
      onCancel={onClose} footer={null} destroyOnHidden width={760}>

      {type === 'persona' ? (
        <div className={styles.header}>
          <Avatar size={72} src={avatarSrc} icon={!avatarSrc ? <UserOutlined /> : undefined} className={styles.avatar} />
          <div className={styles.headerText}>
            <h3 className={styles.headerTitle}>{userRow?.display_name || userRow?.username || '—'}</h3>
            <div className={styles.headerSub}><Text>{userRow?.username || '—'}</Text></div>
            <div className={styles.headerMeta}>
              <span className={styles.rankBadge}>#{userRow?.rank ?? '—'}</span>
              <span className={styles.pointsBadge}>{userRow?.points ?? '—'} pts</span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.header}>
          <div className={styles.headerIcon}><DesktopOutlined /></div>
          <div className={styles.headerText}>
            <h3 className={styles.headerTitle}>{labRow?.lab_name || '—'}</h3>
            {labRow?.computer_name && <div className={styles.headerSub}><Text>{labRow.computer_name}</Text></div>}
            <div className={styles.headerMeta}>
              <span className={styles.rankBadge}>#{labRow?.rank ?? '—'}</span>
              <span className={styles.pointsBadge}>{labRow?.points ?? '—'} pts</span>
            </div>
          </div>
        </div>
      )}

      {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}

      {isLoading ? (
        <Skeleton active paragraph={{ rows: type === 'persona' ? 7 : 6 }} />
      ) : !error && (
        <>
          <div className={styles.metricsGrid}>
            {metrics.map((m) => <MetricRow key={m.title} {...m} />)}
            {topProjects.length > 0 && (
              <div className={styles.metricsGridFull}><TopProjectsBar data={topProjects} /></div>
            )}
          </div>
        </>
      )}

      <WeeklyUsageHeatmap data={weeklyUsage} loading={isLoading} />
    </Modal>
  );
}
