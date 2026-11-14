import { Alert, Button, Card, Flex, Modal, Spin, Tooltip, Typography } from 'antd';
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
      <Card
        hoverable
        onClick={onOpen}
        aria-label={`Open ${title} details`}
        title={
          <Flex justify="space-between" align="flex-start" gap={12} style={{ padding: '4px 0' }}>
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
              <Typography.Text type="secondary">{subtitle}</Typography.Text>
            </div>
            <Tooltip title="Expand chart">
              <Button
                type="text"
                shape="circle"
                icon={<ExpandOutlined />}
                aria-label={`Expand ${title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen();
                }}
              />
            </Tooltip>
          </Flex>
        }
        styles={{ body: { paddingTop: 8 } }}
        style={{ height: 460 }}
      >
        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: 330,
          }}
        >
          {!isOpen && (loading ? <Spin /> : error ? <Alert type="error" showIcon message="Unable to load chart" /> : component)}
        </div>
      </Card>

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
