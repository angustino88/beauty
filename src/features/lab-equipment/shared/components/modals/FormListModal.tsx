import { useState } from 'react';
import { Button, Input, Modal, Space } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface FormListItem {
  key: string;
  value: string;
}

interface FormListModalProps {
  title: string;
  open: boolean;
  initialValues?: FormListItem[];
  onClose: () => void;
  onSave: (items: FormListItem[]) => void;
}

export default function FormListModal({ title, open, initialValues, onClose, onSave }: FormListModalProps) {
  const [items, setItems] = useState<FormListItem[]>(initialValues ?? []);

  const handleAdd = () => {
    setItems([...items, { key: '', value: '' }]);
  };

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'key' | 'value', val: string) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: val } : item)));
  };

  const handleCancel = () => {
    setItems(initialValues ?? []);
    onClose();
  };

  const handleOk = () => {
    onSave(items);
    onClose();
  };

  return (
    <Modal
      title={title}
      open={open}
      style={{ top: '10%' }}
      onCancel={handleCancel}
      onOk={handleOk}
      destroyOnHidden
    >
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
        {items.map((item, index) => (
          <Space key={index}>
            <Input
              placeholder="Enter Object Value"
              value={item.value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
            />
            <Input
              placeholder="Enter Object ID"
              value={item.key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
            />
            <CloseOutlined onClick={() => handleRemove(index)} />
          </Space>
        ))}
        <Button type="dashed" onClick={handleAdd} block>
          + Add Item
        </Button>
      </div>
    </Modal>
  );
}
