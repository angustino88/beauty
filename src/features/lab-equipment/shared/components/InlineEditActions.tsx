import { Button, Space, Tooltip } from 'antd';
import { SaveOutlined, ClearOutlined, CloseOutlined } from '@ant-design/icons';

interface InlineEditActionsProps {
  onSave: () => void;
  onClear: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function InlineEditActions({
  onSave,
  onClear,
  onCancel,
  saving = false,
}: InlineEditActionsProps) {
  return (
    <Space size={8}>
      <Tooltip title="Save">
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave} />
      </Tooltip>
      <Tooltip title="Clear All">
        <Button icon={<ClearOutlined />} onClick={onClear} />
      </Tooltip>
      <Tooltip title="Cancel">
        <Button icon={<CloseOutlined />} danger onClick={onCancel} />
      </Tooltip>
    </Space>
  );
}

export type { InlineEditActionsProps };
