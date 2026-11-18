import { Image, Tooltip, Typography } from 'antd';
import {
  DesktopOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  HddOutlined,
  LaptopOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { isCurrentlyBooked } from '../../types';
import type { LabDetail } from '../../types';
import { MappingVisualization } from '@/features/spaces/mapping/components/MappingVisualization';
import { useGetBenchMappingQuery } from '@/features/spaces/mapping/api';
import dayjs from 'dayjs';
import { LabStatus } from '@/components/display/LabStatus';
import { useInfoModalStyles } from './InfoModal.styles';

function calcDuration(startTime: string): { formatted: string; intervalMs: number } {
  const diffMinutes = dayjs().diff(dayjs(startTime), 'minute');
  const days = Math.floor(diffMinutes / 1440);
  const hours = Math.floor((diffMinutes % 1440) / 60);
  const mins = diffMinutes % 60;

  if (days > 0) return { formatted: `${days} ${days > 1 ? 'days' : 'day'}`, intervalMs: 3_600_000 };
  if (hours > 0) return { formatted: `${hours} ${hours > 1 ? 'hours' : 'hour'}`, intervalMs: 60_000 };
  return { formatted: `${mins} ${mins > 1 ? 'mins' : 'min'}`, intervalMs: 60_000 };
}

interface InfoModalProps {
  data: LabDetail;
}

export default function InfoModal({ data }: InfoModalProps) {
  const { styles } = useInfoModalStyles();
  const [offlineDuration, setOfflineDuration] = useState('–');
  const [inactiveDuration, setInactiveDuration] = useState('–');

  useEffect(() => {
    const status = data?.computer?.status;
    const offlineTime = data?.current_activity?.offline_time;
    const inactiveTime = data?.current_activity?.inactive_time;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const update = () => {
      if (status === 'offline' && offlineTime) {
        const { formatted, intervalMs } = calcDuration(offlineTime);
        setOfflineDuration(formatted);
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(update, intervalMs);
      } else {
        setOfflineDuration('–');
      }

      if (status === 'inactive' && inactiveTime) {
        const { formatted, intervalMs } = calcDuration(inactiveTime);
        setInactiveDuration(formatted);
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(update, intervalMs);
      } else {
        setInactiveDuration('–');
      }
    };

    update();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [data?.computer?.status, data?.current_activity?.offline_time, data?.current_activity?.inactive_time]);

  const booked = isCurrentlyBooked(data?.booking_status);
  // The same mapping the Mapping page shows (room, station, bench, equipment with their real
  // categories, licenses on the equipment that holds them), not one rebuilt from dashboard fields.
  const { data: mappingRow, isFetching: mappingLoading } = useGetBenchMappingQuery(data.id, { skip: !data.id });
  const duration = data.computer?.status === 'offline' ? offlineDuration
    : data.computer?.status === 'inactive' ? inactiveDuration
      : '–';
  const hasRemoteActivity = Boolean(
    data.current_activity?.remote_user
    || data.current_activity?.remote_computer
    || data.current_activity?.remote_ip,
  );
  const status = (data.computer?.status || 'unknown').toLowerCase();

  return (
    <div className={styles.modalContent}>
      <div className={styles.deviceHero}>
        <div className={styles.deviceVisual}>
          {data.image ? (
            <Image src={data.image} alt={data.lab_name} preview={{ mask: 'View image' }} />
          ) : (
            <div className={styles.deviceFallback}>
              <DesktopOutlined />
              <span>{data.computer?.computer_name || 'Lab device'}</span>
            </div>
          )}
          <div className={styles.visualCaption}>{data.sku || 'No SKU assigned'}</div>
        </div>
        <div className={styles.deviceIdentity}>
          <div className={styles.titleLine}>
            <div className={styles.titleIdentity}>
              <Typography.Text className={styles.eyebrow}>{data.lab_group?.lab_group_name || 'Ungrouped lab'}</Typography.Text>
              <Typography.Title level={3}>{data.lab_name || 'Unnamed device'}</Typography.Title>
            </div>
            <div className={styles.statusMeta} data-status={status}>
              <span>Status</span>
              <LabStatus labStatus={status} isBooked={booked} fit />
              {duration !== '–' && <small>{duration}</small>}
            </div>
          </div>
          <div className={styles.quickFacts}>
            <div><LaptopOutlined /><span>Computer<strong>{data.computer?.computer_name || '–'}</strong></span></div>
            <div><GlobalOutlined /><span>IP address<strong>{data.computer?.computer_ip || '–'}</strong></span></div>
            <div><EnvironmentOutlined /><span>Location<strong>{data.location_url ? <a href={data.location_url} target="_blank" rel="noreferrer">{data.location_name || 'Open map'}</a> : data.location_name || '–'}</strong></span></div>
            <div><UserOutlined /><span>Technical user<strong>{data.technical_user?.username || '–'}</strong></span></div>
          </div>
          {data.remark && <div className={styles.remark}>{data.remark}</div>}
        </div>
      </div>

      <section className={styles.activityStrip}>
        <div className={styles.sectionHeading}>
          <span className={styles.headingIcon}><ThunderboltOutlined /></span>
          <div><strong>Live activity</strong><span>{hasRemoteActivity ? 'Remote session detected' : 'No remote session'}</span></div>
        </div>
        <div className={styles.activityFlow}>
          <div><UserOutlined /><span>Remote user<strong>{data.current_activity?.remote_user ? <Tooltip placement="top" title={data.current_activity.remote_user_displayname}><span className={styles.remoteUserValue}>{data.current_activity.remote_user}</span></Tooltip> : '–'}</strong></span></div>
          <div><LaptopOutlined /><span>Remote computer<strong>{data.current_activity?.remote_computer ? <Tooltip placement="top" title={data.current_activity.remote_computer}><span>{data.current_activity.remote_computer}</span></Tooltip> : '–'}</strong></span></div>
          <div><GlobalOutlined /><span>Remote IP<strong>{data.current_activity?.remote_ip ? <Tooltip placement="top" title={data.current_activity.remote_ip}><span>{data.current_activity.remote_ip}</span></Tooltip> : '–'}</strong></span></div>
        </div>
      </section>

      <section className={styles.inventorySection}>
        <div className={styles.inventoryHeading}>
          <div className={styles.sectionHeading}>
            <span className={styles.headingIcon}><HddOutlined /></span>
            <div><strong>Connected equipment</strong><span>Equipment mapping for this lab</span></div>
          </div>
        </div>
        <MappingVisualization
          rows={mappingRow ? [mappingRow] : []}
          loading={mappingLoading && !mappingRow}
          page={1}
          pageSize={1}
          total={mappingRow ? 1 : 0}
          onPageChange={() => undefined}
          showPagination={false}
          compact
          selectedDeviceType="lab"
          selectedDeviceId={data.id}
        />
      </section>
    </div>
  );
}
