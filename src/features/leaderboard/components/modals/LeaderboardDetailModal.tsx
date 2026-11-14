import {
  ClockCircleOutlined, DesktopOutlined, EnvironmentOutlined,
  FieldTimeOutlined, LineChartOutlined, RadarChartOutlined,
  TeamOutlined, UserOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Modal, Skeleton, Typography } from 'antd';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { getAvatarUrl } from '@/shared/utils/avatar';
import type {
  LeaderboardFilter, LabProfile, RankedLabItem,
  RankedPersonaItem, TopProjectItem, UserProfile, WeeklyUsageItem,
} from '../../types';
import {
  useLazyGetUserProfileQuery, useLazyGetUserWeeklyUsageQuery,
  useLazyGetLabProfileQuery, useLazyGetLabWeeklyUsageQuery,
} from '../../api';
import {
  toDateTime, toHours, toNumber, toPercent, toPercentAbsolute,
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [labProfile, setLabProfile] = useState<LabProfile | null>(null);
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
          setUserProfile(profileResult);
          setLabProfile(null);
          setWeeklyUsage(usageResult);
          setTopProjects(profileResult.top_projects ?? []);
        } else {
          const [profileResult, usageResult] = await Promise.all([
            fetchLabProfile(arg).unwrap(),
            fetchLabWeeklyUsage(arg).unwrap(),
          ]);
          if (!mounted) return;
          setLabProfile(profileResult);
          setUserProfile(null);
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
    { icon: <ClockCircleOutlined />, title: 'Last Remote',        value: toDateTime(userProfile?.last_remote) },
    { icon: <TeamOutlined />,        title: 'Total Sessions',     value: toNumber(userProfile?.total_sessions) },
    { icon: <LineChartOutlined />,   title: 'WFO',                value: toPercent(userProfile?.wfo_rate) },
    { icon: <FieldTimeOutlined />,   title: 'Total Usage',        value: toHours(userProfile?.total_usage_minutes != null ? userProfile.total_usage_minutes / 60 : undefined) },
    { icon: <LineChartOutlined />,   title: 'WFH',                value: toPercent(userProfile?.wfh_rate) },
    { icon: <FieldTimeOutlined />,   title: 'Avg Session',        value: toHours(userProfile?.avg_session_minutes != null ? userProfile.avg_session_minutes / 60 : undefined) },
    { icon: <FieldTimeOutlined />,   title: 'Work Late',          value: toPercent(userProfile?.late_rate) },
    { icon: <FieldTimeOutlined />,   title: 'Longest Session',    value: toHours(userProfile?.longest_session_minutes != null ? userProfile.longest_session_minutes / 60 : undefined) },
    { icon: <EnvironmentOutlined />, title: 'Labs Accessed',      value: toNumber(userProfile?.labs_accessed) },
    { icon: <RadarChartOutlined />,  title: 'Usage Efficiency',   value: toPercent(userProfile?.usage_efficiency) },
    { icon: <DesktopOutlined />,     title: 'Booking Compliance', value: toPercent(userProfile?.booking_compliance) },
  ], [userProfile]);

  const labMetrics = useMemo<MetricRowProps[]>(() => [
    { icon: <ClockCircleOutlined />, title: 'Last Remote',        value: toDateTime(labProfile?.last_remote) },
    { icon: <TeamOutlined />,        title: 'Total Sessions',     value: toNumber(labProfile?.total_sessions) },
    { icon: <UserOutlined />,        title: 'Active Users',       value: toNumber(labProfile?.active_users) },
    { icon: <FieldTimeOutlined />,   title: 'Total Usage',        value: toHours(labProfile?.total_usage_minutes != null ? labProfile.total_usage_minutes / 60 : undefined) },
    { icon: <LineChartOutlined />,   title: 'Utilization',        value: toPercent(labProfile?.utilization_rate) },
    { icon: <FieldTimeOutlined />,   title: 'Downtime',           value: toHours(labProfile?.downtime_hours) },
    { icon: <DesktopOutlined />,     title: 'Booking Compliance', value: toPercent(labProfile?.booking_compliance) },
    { icon: <RadarChartOutlined />,  title: 'Availability',       value: toPercentAbsolute(labProfile?.availability) },
  ], [labProfile]);

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
