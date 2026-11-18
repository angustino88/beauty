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
      <Tooltip title="Save changes">
        <Button type="primary" aria-label="Save changes" icon={<SaveOutlined />} loading={saving} onClick={onSave} />
      </Tooltip>
      <Tooltip title="Clear the fields in this row">
        <Button aria-label="Clear the fields in this row" icon={<ClearOutlined />} onClick={onClear} />
      </Tooltip>
      <Tooltip title="Discard changes">
        <Button aria-label="Discard changes" icon={<CloseOutlined />} danger onClick={onCancel} />
      </Tooltip>
    </Space>
  );
}

export type { InlineEditActionsProps };
