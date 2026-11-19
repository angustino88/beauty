import {
  ClockCircleOutlined, DesktopOutlined, EnvironmentOutlined,
  FieldTimeOutlined, LineChartOutlined, RadarChartOutlined,
  TeamOutlined, UserOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Modal, Segmented, Skeleton, Typography } from 'antd';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { getAvatarUrl } from '@/shared/utils/avatar';
import type {
  LeaderboardFilter, RankedLabItem,
  RankedPersonaItem, TopProjectItem, WeeklyUsageItem,
} from '../../types';
import {
  useLazyGetUserProfileQuery, useLazyGetUserWeeklyUsageQuery,
  useLazyGetLabProfileQuery, useLazyGetLabWeeklyUsageQuery,
  useGetBenchAssessmentQuery, useGetUserAssessmentQuery,
} from '../../api';
import {
  toDateTime, toHours, toNumber, toPercent,
} from '../../formatters';
import { TopProjectsBar } from '../charts/TopProjectsBar';
import { WeeklyUsageHeatmap } from '../charts/WeeklyUsageHeatmap';
import { useAppSelector } from '@/app/store';
import { AssessmentReport } from '../assessment/AssessmentView';
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

  const minutesAsHours = (v: number | null | undefined) => toHours(v != null ? v / 60 : undefined);
  const personaMetrics = useMemo<MetricRowProps[]>(() => [
    { icon: <ClockCircleOutlined />, title: 'Last Remote',         value: toDateTime(userRow?.last_remote) },
    { icon: <TeamOutlined />,        title: 'Total Sessions',      value: toNumber(userRow?.total_sessions) },
    { icon: <LineChartOutlined />,   title: 'RFO Rate (Remote from Office)', value: toPercent(userRow?.wfo_rate) },
    { icon: <LineChartOutlined />,   title: 'RFH Rate (Remote from Home)',   value: toPercent(userRow?.wfh_rate) },
    { icon: <FieldTimeOutlined />,   title: 'Total Usage',         value: minutesAsHours(userRow?.total_usage_minutes) },
    { icon: <FieldTimeOutlined />,   title: 'Active Usage',        value: minutesAsHours(userRow?.active_usage_minutes) },
    { icon: <FieldTimeOutlined />,   title: 'Avg Session',         value: minutesAsHours(userRow?.avg_session_minutes) },
    { icon: <FieldTimeOutlined />,   title: 'Longest Session',     value: minutesAsHours(userRow?.longest_session_minutes) },
    { icon: <FieldTimeOutlined />,   title: 'Off-hours Usage Rate', value: toPercent(userRow?.late_rate) },
    { icon: <RadarChartOutlined />,  title: 'Active Time Ratio',   value: toPercent(userRow?.active_rate) },
    { icon: <RadarChartOutlined />,  title: 'Workday Utilization Rate', value: toPercent(userRow?.usage_efficiency) },
    { icon: <EnvironmentOutlined />, title: 'Labs Accessed',       value: toNumber(userRow?.labs_accessed) },
    { icon: <DesktopOutlined />,     title: 'Bookings (no-shows)', value: userRow ? `${userRow.total_bookings} (${userRow.no_show_bookings})` : '—' },
    { icon: <DesktopOutlined />,     title: 'Show-up Rate',        value: toPercent(userRow?.booking_compliance) },
    { icon: <DesktopOutlined />,     title: 'Booking Utilization Rate', value: toPercent(userRow?.booking_utilization) },
    { icon: <DesktopOutlined />,     title: 'Slot Adherence Rate', value: toPercent(userRow?.slot_adherence) },
    { icon: <DesktopOutlined />,     title: 'Early Release Rate',  value: toPercent(userRow?.early_release_rate) },
    { icon: <FieldTimeOutlined />,   title: 'Idle Reserved Time',  value: minutesAsHours(userRow?.idle_reserved_minutes) },
    { icon: <DesktopOutlined />,     title: 'Ad-hoc Session Rate', value: toPercent(userRow?.ad_hoc_rate) },
  ], [userRow]);

  // The ranking row already carries these figures; the profile endpoint adds only the top projects.
  const labMetrics = useMemo<MetricRowProps[]>(() => [
    { icon: <ClockCircleOutlined />, title: 'Last Remote',         value: toDateTime(labRow?.last_remote) },
    { icon: <TeamOutlined />,        title: 'Total Sessions',      value: toNumber(labRow?.total_sessions) },
    { icon: <UserOutlined />,        title: 'Active Users',        value: toNumber(labRow?.active_users) },
    { icon: <FieldTimeOutlined />,   title: 'Active Usage',        value: toHours(labRow?.total_usage_minutes != null ? labRow.total_usage_minutes / 60 : undefined) },
    { icon: <RadarChartOutlined />,  title: 'Bench Utilization Rate', value: toPercent(labRow?.utilization_rate) },
    { icon: <RadarChartOutlined />,  title: 'Booking Occupancy Rate', value: toPercent(labRow?.booking_fill) },
    { icon: <DesktopOutlined />,     title: 'Bookings (no-shows)', value: labRow ? `${labRow.total_bookings} (${labRow.no_show_bookings})` : '—' },
    { icon: <DesktopOutlined />,     title: 'Show-up Rate',        value: toPercent(labRow?.booking_compliance) },
    { icon: <DesktopOutlined />,     title: 'Booking Utilization Rate', value: toPercent(labRow?.booking_utilization) },
    { icon: <DesktopOutlined />,     title: 'Early Release Rate',  value: toPercent(labRow?.early_release_rate) },
  ], [labRow]);

  // Coordinators and admins see every assessment; a user sees their own. The API enforces the same rule.
  const permissionGroups = useAppSelector((state) => state.me.permissionGroups) as Record<string, unknown> | null;
  const myId = useAppSelector((state) => state.me.id);
  const isStaff = Boolean(permissionGroups?.['admin'] || permissionGroups?.['lab-coordinator']);
  const isOwn = type === 'persona' && myId != null && userRow?.id === myId;
  const canSeeAssessment = isStaff || isOwn;
  const assessmentArg = { id: selectedId ?? 0, filter };
  // The chosen tab belongs to the subject shown: opening another user or bench starts on Overview.
  const subjectKey = `${type}:${selectedId ?? ''}`;
  const [tabState, setTabState] = useState<{ subject: string; tab: 'overview' | 'assessment' }>({ subject: '', tab: 'overview' });
  const tab = open && tabState.subject === subjectKey ? tabState.tab : 'overview';
  const setTab = (next: 'overview' | 'assessment') => setTabState({ subject: subjectKey, tab: next });
  const showAssessment = open && canSeeAssessment && tab === 'assessment' && Boolean(selectedId);
  const userAssessment = useGetUserAssessmentQuery(assessmentArg, { skip: !showAssessment || type !== 'persona' });
  const benchAssessment = useGetBenchAssessmentQuery(assessmentArg, { skip: !showAssessment || type !== 'lab' });
  const assessmentQuery = type === 'persona' ? userAssessment : benchAssessment;

  const metrics = type === 'persona' ? personaMetrics : labMetrics;

  return (
    <Modal open={open} title={type === 'persona' ? 'User Profile' : 'Lab Profile'}
      onCancel={onClose} footer={null} destroyOnHidden width={canSeeAssessment ? 880 : 760}>

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

      {canSeeAssessment && (
        <Segmented
          className={styles.viewSwitch}
          value={tab}
          onChange={(value) => setTab(value as 'overview' | 'assessment')}
          options={[
            { label: 'Overview', value: 'overview' },
            { label: 'Assessment', value: 'assessment' },
          ]}
        />
      )}

      {tab === 'assessment' ? (
        <AssessmentReport
          assessment={assessmentQuery.currentData}
          loading={assessmentQuery.isFetching}
          error={assessmentQuery.isError}
          audience={type === 'lab' ? 'bench' : isOwn ? 'self' : 'user'}
        />
      ) : (
        <>
          {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}

          {isLoading ? (
            <Skeleton active paragraph={{ rows: type === 'persona' ? 7 : 6 }} />
          ) : !error && (
            <div className={styles.metricsGrid}>
              {metrics.map((m) => <MetricRow key={m.title} {...m} />)}
              {topProjects.length > 0 && (
                <div className={styles.metricsGridFull}><TopProjectsBar data={topProjects} /></div>
              )}
            </div>
          )}

          <WeeklyUsageHeatmap data={weeklyUsage} loading={isLoading} />
        </>
      )}
    </Modal>
  );
}
