import { useState } from 'react';
import { Empty, Input, Segmented, Select, Table, Tag } from 'antd';
import { InlineAlert } from '@/shared/notifications';
import type { LabsLicenseObservationsRetrieveApiArg } from '@/shared/api/generated/api';
import { useGetLicenseObservationsQuery } from './api';
import { observationColumns } from './observationColumns';
import styles from './LicenseChecks.module.css';

const STATUS_OPTIONS = [
  { value: 'unregistered', label: 'Not in inventory' },
  { value: 'ambiguous', label: 'Several licenses match' },
  { value: 'carrier_unlinked', label: 'Carrier not linked' },
  { value: 'carrier_not_at_computer', label: 'Carrier not at this computer' },
  { value: 'carrier_mismatch', label: 'Assigned elsewhere' },
  { value: 'unassigned', label: 'Not assigned' },
  { value: 'matched', label: 'Matched' },
];
type Scope = 'attention' | 'all';
type Status = NonNullable<LabsLicenseObservationsRetrieveApiArg['status']>;

/** Licenses agents found on lab computers and hardware, with what a coordinator should fix. */
export function FoundLicensesPanel({ checkId, onClearCheck }: { checkId?: number; onClearCheck?: () => void }) {
  const [scope, setScope] = useState<Scope>('attention');
  const [status, setStatus] = useState<Status>();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isFetching, isError, refetch } = useGetLicenseObservationsQuery({
    checkId,
    status,
    isAttentionRequired: status ? undefined : scope === 'attention' ? true : undefined,
    q,
    page,
  });

  return (
    <div className={styles.panel}>
      <p className={styles.intro}>
        Licenses the agents found. Matched ones keep the inventory current on their own; the others need a coordinator: register the
        license, add the carrier&apos;s hardware ID, or fix its assignment.
      </p>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <Segmented<Scope>
            value={scope}
            onChange={(value) => { setScope(value); setStatus(undefined); setPage(1); }}
            options={[{ value: 'attention', label: 'Needs attention' }, { value: 'all', label: 'All found' }]}
          />
          <Select
            allowClear
            placeholder="Any match result"
            aria-label="Match result"
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            options={STATUS_OPTIONS}
            style={{ minWidth: 220 }}
          />
          {checkId !== undefined && <Tag closable onClose={onClearCheck} color="purple">One check</Tag>}
        </div>
        <Input.Search allowClear placeholder="Product, serial, carrier or computer" onSearch={(value) => { setQ(value); setPage(1); }} style={{ maxWidth: 320 }} aria-label="Search found licenses" />
      </div>
      {isError && (
        <InlineAlert
          variant="warning"
          title="Unable to load found licenses"
          onRetry={() => void refetch()}
        />
      )}
      <Table
        rowKey="id"
        size="middle"
        loading={isFetching}
        columns={observationColumns()}
        dataSource={data?.data ?? []}
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.meta.pagination.count ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={scope === 'attention' && !status ? 'Nothing needs attention' : 'No license found yet'}
            />
          ),
        }}
      />
    </div>
  );
}

/** "Observed on lab hardware" for one inventory license (license details). */
export function LicenseObservedPanel({ licenseId }: { licenseId: number }) {
  const { data, isFetching } = useGetLicenseObservationsQuery({ licenseId, pageSize: 20 });
  const rows = data?.data ?? [];
  if (!isFetching && rows.length === 0) return null;
  return (
    <section className={styles.panel} aria-label="Observed on lab hardware" style={{ marginTop: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14 }}>Observed on lab hardware</h3>
      <Table rowKey="id" size="small" loading={isFetching} columns={observationColumns()} dataSource={rows} pagination={false} scroll={{ x: 900 }} />
    </section>
  );
}
