import { ExportOutlined } from '@ant-design/icons';
import { Button, Col, Form, Row } from 'antd';
import type { ReactNode } from 'react';

export interface ChartFilterProps {
  children: ReactNode;
  initialValues?: Record<string, unknown>;
  handleFinish: (values: Record<string, unknown>) => void;
  onExport?: () => void | Promise<void>;
}

export function ChartFilter({
  children,
  initialValues,
  handleFinish,
  onExport,
}: ChartFilterProps) {
  const [formInstance] = Form.useForm();

  return (
    <Form
      form={formInstance}
      layout="inline"
      initialValues={initialValues}
      onValuesChange={(_, allValues) => handleFinish(allValues as Record<string, unknown>)}
      style={{ marginBottom: '20px' }}
    >
      <Row gutter={[0, 8]} style={{ width: '100%' }}>
        {children}
        <Col flex="none">
          <Button
            type="primary"
            icon={<ExportOutlined />}
            htmlType="button"
            disabled={!onExport}
            onClick={() => void onExport?.()}
            style={{ whiteSpace: 'nowrap' }}
          >
            Export
          </Button>
        </Col>
      </Row>
    </Form>
  );
}
