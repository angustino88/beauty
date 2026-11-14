import { Alert, Button, Modal, Spin, Tooltip } from 'antd';
import styles from './ChartCard.module.css';
import { ExpandOutlined, ExportOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

interface ChartCardProps {
  id: number;
  title: string;
  subtitle: string;
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  component: ReactNode;
  filters?: ReactNode;
  onExport?: () => void | Promise<void>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function ChartCard({
  title,
  subtitle,
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
  return (
    <>
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.titles}>
            <h3>{title}</h3>
            <span>{subtitle}</span>
          </div>
          <Tooltip title="Expand chart">
            <Button type="text" shape="circle" icon={<ExpandOutlined />} aria-label={`Expand ${title}`} onClick={onOpen} />
          </Tooltip>
        </header>
        <div className={styles.body}>
          {!isOpen && (loading ? <Spin /> : error ? <Alert type="error" showIcon message="Unable to load chart" action={onRetry && <Button size="small" onClick={onRetry}>Retry</Button>} /> : component)}
        </div>
      </section>

      <Modal
        width="min(1080px, calc(100vw - 32px))"
        title={title}
        open={isOpen}
        onCancel={onClose}
        footer={
          onExport && !filters
            ? [
                <Button key="export" type="primary" icon={<ExportOutlined />} onClick={() => void onExport()}>
                  Export
                </Button>,
                <Button key="close" onClick={onClose}>
                  Close
                </Button>,
              ]
            : [
                <Button key="close" onClick={onClose}>
                  Close
                </Button>,
              ]
        }
        style={{ top: '10%' }}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {error ? <Alert type="error" showIcon message="Unable to load chart data" action={onRetry && <Button size="small" onClick={onRetry}>Retry</Button>} /> : <>{filters}{component}</>}
      </Modal>
    </>
  );
}
