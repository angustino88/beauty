import React from 'react';
import { Collapse, Descriptions } from 'antd';
import {
  DesktopOutlined,
  ToolOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import EquipmentStatus from '../status/EquipmentStatus';
import { MappingVisualization } from '@/features/spaces/mapping/components/MappingVisualization';
import type { ResourceMappingRow } from '@/features/spaces/mapping/types';
import styles from './EquipmentCompactSummary.module.css';

interface EquipmentCompactSummaryProps {
  equipmentType: string;
  record: Record<string, unknown>;
  connectedRows: ResourceMappingRow[];
  displayStatus: unknown;
}

const getCategoryIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'computing':
      return <DesktopOutlined />;
    case 'networking':
      return <ApiOutlined />;
    case 'power':
    case 'power_supply':
      return <ThunderboltOutlined />;
    case 'instrument':
    case 'debugging':
      return <ToolOutlined />;
    default:
      return <DesktopOutlined />;
  }
};

export const EquipmentCompactSummary: React.FC<EquipmentCompactSummaryProps> = ({
  equipmentType,
  record,
  connectedRows,
  displayStatus,
}) => {
  const name = String(record.name || record.lab_name || record.sku || `${equipmentType} equipment`);
  const sku = record.sku ? String(record.sku) : null;
  const serial = record.serial_number ? String(record.serial_number) : null;
  const image = typeof record.image === 'string' && record.image ? record.image : null;

  // Placement info
  const primaryPlacement = connectedRows[0];
  const benchName = primaryPlacement?.bench?.name || primaryPlacement?.bench?.sku;
  const roomName = primaryPlacement?.room?.name || primaryPlacement?.room?.sku;
  const storageRoom = record.storage_room ? String(record.storage_room) : null;

  // Owner info
  const owner = record.owner || record.primary_owner ? String(record.owner || record.primary_owner) : null;
  const department = record.department ? String(record.department) : null;

  // Pricing & Warranty. Reference objects can carry a nested amount value.
  const priceValue = typeof record.acquisition_price === 'object' && record.acquisition_price !== null
    ? (record.acquisition_price as Record<string, unknown>).amount ?? (record.acquisition_price as Record<string, unknown>).value
    : record.acquisition_price;
  const price = priceValue != null && priceValue !== '' && Number.isFinite(Number(priceValue))
    ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(priceValue))
    : null;
  const warranty = record.warranty_until ? dayjs(String(record.warranty_until)).format('YYYY-MM-DD') : null;

  // Network info
  const ip = record.ip_address ? String(record.ip_address) : null;
  const host = record.hostname ? String(record.hostname) : null;

  const remark = record.remark || record.details || record.information ? String(record.remark || record.details || record.information) : null;

  return (
    <div className={styles.container}>
      <div className={styles.identityCard}>
        <div className={styles.thumbnail}>
          {image ? <img src={image} alt={name} /> : getCategoryIcon(equipmentType)}
        </div>
        <div className={styles.identityCopy}>
          <span className={styles.categoryTag}>{equipmentType}</span>
          <div className={styles.metaLine}>
            {Boolean(record.product_model) && <span>{String(record.product_model)}</span>}
            {serial && <span>Serial {serial}</span>}
          </div>
        </div>
        <div className={styles.identityStatus}>
          <EquipmentStatus status={displayStatus} />
        </div>
      </div>

      <section className={styles.detailSection}>
        <h4 className={styles.sectionTitle}><ApartmentOutlined className={styles.sectionTitleIcon} />At a glance</h4>
        <div className={styles.metricGrid}>
          <div className={styles.metricCard}>
            <span className={styles.ribbonLabel}>Placement</span>
            <strong>{benchName ? benchName : storageRoom ? `Storage: ${storageRoom}` : 'Unplaced'}</strong>
            <span>{roomName ? `Room: ${roomName}` : <Link to="/spaces/mapping">Explore mapping</Link>}</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.ribbonLabel}>Owner</span>
            <strong>{owner || 'Not assigned'}</strong>
            {department && <span>{department}</span>}
          </div>
          {(price || warranty) && <div className={styles.metricCard}>
            <span className={styles.ribbonLabel}>Acquisition & warranty</span>
            <strong>{price || '—'}</strong>
            {warranty && <span>Warranty until {warranty}</span>}
          </div>}
          {(ip || host) && <div className={styles.metricCard}>
            <span className={styles.ribbonLabel}>Network</span>
            <strong>{ip || host}</strong>
            {host && ip && <span>{host}</span>}
          </div>}
        </div>
      </section>

      {/* 3. Hardware & Identification */}
      <section className={styles.detailSection}>
        <h4 className={styles.sectionTitle}>
          <InfoCircleOutlined className={styles.sectionTitleIcon} />
          Hardware & Identification
        </h4>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
          {sku && <Descriptions.Item label="SKU">{sku}</Descriptions.Item>}
          {Boolean(record.manufacturer) && (
            <Descriptions.Item label="Manufacturer">{String(record.manufacturer)}</Descriptions.Item>
          )}
          {Boolean(record.product_model) && (
            <Descriptions.Item label="Product Model">{String(record.product_model)}</Descriptions.Item>
          )}
          {Boolean(serial) && <Descriptions.Item label="Serial Number">{serial}</Descriptions.Item>}
          {Boolean(record.kind) && <Descriptions.Item label="Kind">{String(record.kind)}</Descriptions.Item>}
          {Boolean(record.type) && <Descriptions.Item label="Type">{String(record.type)}</Descriptions.Item>}
          {Boolean(record.log_label) && (
            <Descriptions.Item label="Log Label">{String(record.log_label)}</Descriptions.Item>
          )}
        </Descriptions>
      </section>

      {/* 4. Ownership & Placement */}
      <section className={styles.detailSection}>
        <h4 className={styles.sectionTitle}>
          <EnvironmentOutlined className={styles.sectionTitleIcon} />
          Ownership & Placement
        </h4>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
          {Boolean(department) && <Descriptions.Item label="Department">{department}</Descriptions.Item>}
          {Boolean(record.group) && <Descriptions.Item label="Group">{String(record.group)}</Descriptions.Item>}
          {Boolean(record.technical_user) && (
            <Descriptions.Item label="Technical User">{String(record.technical_user)}</Descriptions.Item>
          )}
        </Descriptions>
      </section>

      {/* 5. Network & Telemetry (if present) */}
      {(Boolean(ip) || Boolean(host) || Boolean(record.mac_address) || Boolean(record.os_name)) && (
        <section className={styles.detailSection}>
          <h4 className={styles.sectionTitle}>
            <ApiOutlined className={styles.sectionTitleIcon} />
            Network & Telemetry
          </h4>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            {Boolean(host) && <Descriptions.Item label="Hostname">{host}</Descriptions.Item>}
            {Boolean(ip) && <Descriptions.Item label="IP Address">{ip}</Descriptions.Item>}
            {Boolean(record.mac_address) && (
              <Descriptions.Item label="MAC Address">{String(record.mac_address)}</Descriptions.Item>
            )}
            {Boolean(record.os_name) && (
              <Descriptions.Item label="Operating System">{String(record.os_name)}</Descriptions.Item>
            )}
          </Descriptions>
        </section>
      )}

      {/* 6. Remarks / Notes */}
      {Boolean(remark) && (
        <div className={styles.remarkBox}>
          <strong>Notes:</strong> {remark}
        </div>
      )}

      {/* 7. Connected Relationship Graph Collapse */}
      {connectedRows.length > 0 && (
        <Collapse
          items={[
            {
              key: 'topology',
              label: (
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  <ApartmentOutlined style={{ marginRight: 6, color: '#6155d9' }} />
                  Placement topology & connected hierarchy
                </span>
              ),
              children: (
                <MappingVisualization
                  rows={connectedRows}
                  loading={false}
                  showPagination={false}
                  compact
                  selectedDeviceType={equipmentType}
                  selectedDeviceId={Number(record.id)}
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
};

export default EquipmentCompactSummary;
