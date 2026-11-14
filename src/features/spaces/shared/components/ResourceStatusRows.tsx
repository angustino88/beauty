import React from 'react';
import { Alert, Tag } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  LockOutlined,
  UnlockOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { LocationState, ResourceState } from '../resourceStatus';
import styles from './ResourceStatusComponents.module.css';

interface ResourceStatusRowsProps {
  record: Partial<LocationState & ResourceState>;
  spaceKind?: 'room' | 'station' | 'bench';
  currentDowntimeNote?: string;
  onNavigateBlockedBy?: (type: 'room' | 'station' | 'bench', id: number) => void;
}

export const ResourceStatusRows: React.FC<ResourceStatusRowsProps> = ({
  record,
  spaceKind,
  currentDowntimeNote,
  onNavigateBlockedBy,
}) => {
  const lifecycle = record.lifecycle_status;
  const condition = record.condition;
  const availability = record.availability;
  const activity = record.activity_status;
  const access = record.access_policy;

  const isRestricted =
    access?.value === 'restricted' ||
    (typeof access === 'string' && (access as string).toLowerCase() === 'restricted');

  const isBlocked = availability?.value === 'unavailable';
  const isHealthy = condition?.value === 'operational' && !isBlocked;

  // Lifecycle color tone
  const getLifecycleTag = () => {
    switch (lifecycle?.value) {
      case 'in_service':
        return (
          <span className={styles.badgeLifecycleInService}>
            <CheckCircleFilled style={{ fontSize: 10 }} /> In Service
          </span>
        );
      case 'planned':
        return <span className={styles.badgeLifecyclePlanned}>Planned</span>;
      case 'retired':
        return <span className={styles.badgeLifecycleRetired}>Retired</span>;
      default:
        return <span className={styles.badgeLifecycleRetired}>{lifecycle?.label || lifecycle?.value || '—'}</span>;
    }
  };

  // Condition color & icon
  const getConditionContent = () => {
    switch (condition?.value) {
      case 'operational':
        return (
          <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CheckCircleFilled /> Operational
          </span>
        );
      case 'in_maintenance':
        return (
          <span style={{ color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ExclamationCircleFilled /> In Maintenance
          </span>
        );
      case 'out_of_service':
        return (
          <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CloseCircleFilled /> Out of Service
          </span>
        );
      default:
        return <span>{condition?.label || condition?.value || '—'}</span>;
    }
  };

  // Activity tag
  const getActivityTag = () => {
    switch (activity?.value) {
      case 'active':
        return <Tag color="success">In Use (Active)</Tag>;
      case 'scheduled':
        return <Tag color="processing">Booked Today</Tag>;
      case 'idle':
        return <Tag color="default">Idle</Tag>;
      default:
        return <Tag>{activity?.label || activity?.value || '—'}</Tag>;
    }
  };

  return (
    <div className={styles.statusCard}>
      <div className={styles.statusCardHeader}>
        <div className={styles.statusCardTitle}>
          <AppstoreOutlined className={styles.statusCardTitleIcon} />
          <span>Operational State & Availability</span>
        </div>
        <div>
          {isHealthy ? (
            <Tag color="success" style={{ margin: 0, fontWeight: 600 }}>
              ● Operational
            </Tag>
          ) : isBlocked ? (
            <Tag color="warning" style={{ margin: 0, fontWeight: 600 }}>
              ● Unavailable
            </Tag>
          ) : null}
        </div>
      </div>

      {/* Warning/Alert banner when unavailable or in maintenance */}
      {isBlocked && (
        <Alert
          className={styles.statusBanner}
          type="warning"
          showIcon
          message={
            availability?.blocked_by ? (
              <span>
                Resource is unavailable: blocked by{' '}
                <strong>
                  {availability.blocked_by.type.charAt(0).toUpperCase() +
                    availability.blocked_by.type.slice(1)}{' '}
                  {availability.blocked_by.name}
                </strong>
                {availability.reason ? ` (${availability.reason})` : ''}.
              </span>
            ) : (
              <span>
                Resource is currently unavailable
                {availability?.reason ? ` (${availability.reason})` : ''}.
              </span>
            )
          }
        />
      )}

      {condition?.value === 'out_of_service' && !isBlocked && (
        <Alert
          className={styles.statusBanner}
          type="error"
          showIcon
          message="Resource is out of service due to an active fault or hold."
          description={currentDowntimeNote}
        />
      )}

      {/* Clean metric status grid */}
      <div className={styles.statusGrid}>
        {/* Lifecycle */}
        <div className={styles.statusTile}>
          <div>
            <div className={styles.tileLabel}>
              <SafetyCertificateOutlined className={styles.tileLabelIcon} />
              <span>Lifecycle</span>
            </div>
            <div className={styles.tileValue}>{getLifecycleTag()}</div>
          </div>
          <div className={styles.tileDescription}>
            Management lifecycle status
          </div>
        </div>

        {/* Condition */}
        <div className={styles.statusTile}>
          <div>
            <div className={styles.tileLabel}>
              <ThunderboltOutlined className={styles.tileLabelIcon} />
              <span>Condition</span>
            </div>
            <div className={styles.tileValue}>{getConditionContent()}</div>
          </div>
          <div className={styles.tileDescription}>
            {currentDowntimeNote || 'Healthy condition with no active fault'}
          </div>
        </div>

        {/* Availability */}
        <div className={styles.statusTile}>
          <div>
            <div className={styles.tileLabel}>
              <ClockCircleOutlined className={styles.tileLabelIcon} />
              <span>Availability</span>
            </div>
            <div className={styles.tileValue}>
              {availability?.value === 'unavailable' ? (
                <Tag color="warning" style={{ margin: 0, fontWeight: 600 }}>
                  Unavailable
                </Tag>
              ) : (
                <Tag color="success" style={{ margin: 0, fontWeight: 600 }}>
                  {spaceKind === 'room' || spaceKind === 'station' ? 'Operational' : 'Available'}
                </Tag>
              )}
            </div>
          </div>
          <div className={styles.tileDescription}>
            {availability?.value === 'unavailable' && availability.blocked_by ? (
              <span>
                Blocked by{' '}
                {onNavigateBlockedBy ? (
                  <button
                    type="button"
                    className={styles.tileLinkBtn}
                    onClick={() =>
                      availability.blocked_by &&
                      onNavigateBlockedBy(
                        availability.blocked_by.type,
                        availability.blocked_by.id,
                      )
                    }
                  >
                    {availability.blocked_by.type} {availability.blocked_by.name}
                  </button>
                ) : (
                  <strong>
                    {availability.blocked_by.type} {availability.blocked_by.name}
                  </strong>
                )}
                {availability.reason ? ` (${availability.reason})` : ''}
              </span>
            ) : availability?.value === 'unavailable' ? (
              <span>Blocked {availability.reason ? `(${availability.reason})` : ''}</span>
            ) : (
              spaceKind === 'room' || spaceKind === 'station'
                ? 'Ready for placement and equipment setup'
                : 'Ready for booking and placement'
            )}
          </div>
        </div>

        {/* Activity */}
        <div className={styles.statusTile}>
          <div>
            <div className={styles.tileLabel}>
              <ClockCircleOutlined className={styles.tileLabelIcon} />
              <span>Activity</span>
            </div>
            <div className={styles.tileValue}>{getActivityTag()}</div>
          </div>
          <div className={styles.tileDescription}>
            Current usage and booking telemetry
          </div>
        </div>

        {/* Access (Room & Station only) */}
        {access && (
          <div className={styles.statusTile}>
            <div>
              <div className={styles.tileLabel}>
                {isRestricted ? (
                  <LockOutlined className={styles.tileLabelIcon} style={{ color: '#d97706' }} />
                ) : (
                  <UnlockOutlined className={styles.tileLabelIcon} style={{ color: '#16a34a' }} />
                )}
                <span>Access Policy</span>
              </div>
              <div className={styles.tileValue}>
                {isRestricted ? (
                  <span className={styles.badgeAccessRestricted}>
                    <LockOutlined /> Restricted
                  </span>
                ) : (
                  <span className={styles.badgeAccessOpen}>
                    <UnlockOutlined /> Open Access
                  </span>
                )}
              </div>
            </div>
            <div className={styles.tileDescription}>
              {isRestricted
                ? 'Authorized personnel only'
                : 'Available to all lab members'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceStatusRows;
