import { Alert, Button, Modal, Spin, Tooltip } from 'antd';
import styles from './ChartCard.module.css';
import { DownloadOutlined, ExpandOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

interface ChartCardProps {
  id: number;
  title: string;
  /** What the numbers are and for which period, e.g. "Top 5, highest first · 10–16 Nov 2026". */
  subtitle: string;
  /** One line on how the metric is calculated; shown as a hint next to the title. */
  description?: string;
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  component: ReactNode;
  /** Shown on the card and again in the expanded view; both edit the same filters. */
  filters?: ReactNode;
  onExport?: () => void | Promise<void>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function ChartCard({
  title,
  subtitle,
  description,
  loading,
  error,
  onRetry,
  component,
  filters,
  onExport,
  isOpen,
  onOpen,
  onClose,
}: ChartCardProps) {
  const errorBox = (
    <Alert type="error" showIcon message="Unable to load chart data" action={onRetry && <Button size="small" onClick={onRetry}>Retry</Button>} />
  );
  return (
    <>
      <section className={styles.card} aria-label={title}>
        <header className={styles.header}>
          <div className={styles.titles}>
            <h3 title={description}>{title}</h3>
            <span>{subtitle}</span>
          </div>
          <div className={styles.tools}>
            {onExport && (
              <Tooltip title="Export to Excel">
                <Button type="text" shape="circle" icon={<DownloadOutlined />} aria-label={`Export ${title}`} onClick={() => void onExport()} />
              </Tooltip>
            )}
            <Tooltip title="Expand chart">
              <Button type="text" shape="circle" icon={<ExpandOutlined />} aria-label={`Expand ${title}`} onClick={onOpen} />
            </Tooltip>
          </div>
        </header>
        {filters && !isOpen && <div className={styles.filters}>{filters}</div>}
        <div className={styles.body}>
          {!isOpen && (loading ? <Spin /> : error ? errorBox : component)}
        </div>
      </section>

      <Modal
        width="min(1080px, calc(100vw - 32px))"
        title={<div className={styles.modalTitle}><span>{title}</span><small>{subtitle}</small></div>}
        open={isOpen}
        onCancel={onClose}
        footer={[
          ...(onExport ? [<Button key="export" icon={<DownloadOutlined />} onClick={() => void onExport()}>Export</Button>] : []),
          <Button key="close" type="primary" onClick={onClose}>Close</Button>,
        ]}
        style={{ top: '10%' }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {description && <p className={styles.description}>{description}</p>}
        {filters && <div className={styles.modalFilters}>{filters}</div>}
        {loading ? <Spin /> : error ? errorBox : component}
      </Modal>
    </>
  );
}
