import { useCallback, useMemo, useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Upload, message, type UploadFile } from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import type { FormInstance, UploadProps } from 'antd';
import dayjs from 'dayjs';
import type { FieldConfig } from './EquipmentFormModal';

export interface EquipmentCreateModalProps {
  open: boolean;
  title: string;
  fields: FieldConfig[];
  onSubmit: (values: Record<string, unknown>, imageFile: File | null) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  initialValues?: Record<string, unknown>;
  form?: FormInstance;
}

const IMAGE_UPLOAD_ACCEPT = '.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp';
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_IMAGE_SIZE_MB = 10;

function parseQuarterInput(raw: unknown) {
  if (typeof raw === 'string') {
    const matched = raw.match(/^(\d{4})-Q([1-4])$/);
    if (matched) {
      const year = Number(matched[1]);
      const quarter = Number(matched[2]);
      const month = (quarter - 1) * 3 + 1;
      return dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    }
  }
  return raw ? dayjs(String(raw)) : undefined;
}

export default function EquipmentCreateModal({
  open,
  title,
  fields,
  onSubmit,
  onCancel,
  loading = false,
  initialValues,
  form: providedForm,
}: EquipmentCreateModalProps) {
  const [internalForm] = Form.useForm();
  const form = providedForm ?? internalForm;
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageList, setImageList] = useState<UploadFile[]>([]);

  const preparedValues = useMemo(() => {
    if (!initialValues) {
      return {};
    }
    const nextValues: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = initialValues[field.name];
      if (field.type === 'date') {
        nextValues[field.name] = raw ? dayjs(String(raw)) : undefined;
      } else if (field.type === 'quarter') {
        nextValues[field.name] = parseQuarterInput(raw);
      } else if (field.type === 'select' && raw && typeof raw === 'object' && 'id' in raw) {
        nextValues[field.name] = (raw as { id?: number | string }).id;
      } else if (field.type === 'multi-select' && Array.isArray(raw)) {
        nextValues[field.name] = raw.map((item) => {
          if (item && typeof item === 'object' && 'id' in item) {
            return (item as { id?: number | string }).id;
          }
          return item;
        });
      } else {
        nextValues[field.name] = raw ?? undefined;
      }
    }
    return nextValues;
  }, [fields, initialValues]);

  const preparedImageList = useMemo<UploadFile[]>(() => {
    if (!initialValues) {
      return [];
    }
    const preview = initialValues.image;
    return typeof preview === 'string' && preview
      ? [{ uid: '-1', name: 'image', status: 'done', url: preview }]
      : [];
  }, [initialValues]);

  const handleAfterOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) return;
    form.resetFields();
    form.setFieldsValue(preparedValues);
    setImageFile(null);
    setImageList(preparedImageList);
  }, [form, preparedImageList, preparedValues]);

  const handleCancel = useCallback(() => {
    const hadInitialImage = preparedImageList.length > 0;
    const hasCurrentImage = imageList.length > 0;
    const hasImageStateChanged = hadInitialImage !== hasCurrentImage || imageFile !== null;
    const hasUnsavedInput = form.isFieldsTouched() || hasImageStateChanged;
    if (!hasUnsavedInput) {
      onCancel();
      return;
    }
    Modal.confirm({
      title: 'Discard changes?',
      content: 'You have unsaved changes. Do you want to discard them?',
      okText: 'Discard',
      cancelText: 'Continue editing',
      onOk: onCancel,
    });
  }, [form, imageFile, imageList.length, onCancel, preparedImageList.length]);

  const handleBeforeUpload: UploadProps['beforeUpload'] = useCallback((file) => {
    const nextFile = file as RcFile;
    const mimeAllowed = ALLOWED_IMAGE_MIME.has(nextFile.type);
    const extAllowed = /\.(jpe?g|png|gif|webp)$/i.test(nextFile.name);
    if (!mimeAllowed && !extAllowed) {
      message.error('Only JPG, JPEG, PNG, GIF, WEBP files are allowed.');
      return Upload.LIST_IGNORE;
    }
    const sizeInMb = nextFile.size / (1024 * 1024);
    if (sizeInMb > MAX_IMAGE_SIZE_MB) {
      message.error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`);
      return Upload.LIST_IGNORE;
    }
    setImageFile(nextFile);
    setImageList([
      {
        uid: nextFile.uid,
        name: nextFile.name,
        status: 'done',
        originFileObj: nextFile,
      },
    ]);
    return false;
  }, []);

  const renderField = (field: FieldConfig) => {
    switch (field.type) {
      case 'text':
        return <Input placeholder={field.placeholder ?? `Enter ${field.label}`} />;
      case 'number':
        return <InputNumber style={{ width: '100%' }} placeholder={field.placeholder ?? `Enter ${field.label}`} />;
      case 'select':
        return (
          <Select
            showSearch
            allowClear
            placeholder={field.placeholder ?? `Select ${field.label}`}
            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={field.options}
            {...(field.creatable ? { mode: 'tags' as const, tokenSeparators: [','] } : {})}
          />
        );
      case 'multi-select':
        return (
          <Select
            mode="multiple"
            showSearch
            allowClear
            placeholder={field.placeholder ?? `Select ${field.label}`}
            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={field.options}
          />
        );
      case 'date':
        return <DatePicker style={{ width: '100%' }} />;
      case 'quarter':
        return <DatePicker picker="quarter" style={{ width: '100%' }} />;
      case 'textarea':
        return <Input.TextArea rows={3} placeholder={field.placeholder ?? `Enter ${field.label}`} />;
      case 'image':
        return (
          <Upload.Dragger
            accept={IMAGE_UPLOAD_ACCEPT}
            beforeUpload={handleBeforeUpload}
            fileList={imageList}
            maxCount={1}
            multiple={false}
            onRemove={() => {
              setImageFile(null);
              setImageList([]);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Upload Image</p>
            <p className="ant-upload-hint">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">Supported formats: JPG, JPEG, PNG, GIF, WEBP.</p>
          </Upload.Dragger>
        );
      default:
        return <Input />;
    }
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    for (const field of fields) {
      if ((field.type === 'date' || field.type === 'quarter') && values[field.name]) {
        values[field.name] = dayjs(values[field.name]).format(field.type === 'quarter' ? 'YYYY-[Q]Q' : 'YYYY-MM-DD');
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(values, imageFile);
      form.resetFields();
      setImageFile(null);
      setImageList([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={handleCancel}
      onOk={handleOk}
      afterOpenChange={handleAfterOpenChange}
      width={600}
      style={{ top: '10%' }}
      destroyOnHidden
      maskClosable
      confirmLoading={loading || submitting}
      okText="Create"
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', scrollbarWidth: 'thin', padding: '0 10px' } }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={[8, 8]}>
          {fields.map((field) => {
            const span = field.type === 'image' ? 24 : 12;
            if (field.type === 'image') {
              return (
                <Col key={field.name} span={span}>
                  <Form.Item label={field.label}>{renderField(field)}</Form.Item>
                </Col>
              );
            }

            return (
              <Col key={field.name} span={span}>
                <Form.Item
                  name={field.name}
                  label={field.label}
                  rules={field.required ? [{ required: true, message: `${field.label} is required` }] : undefined}
                >
                  {renderField(field)}
                </Form.Item>
              </Col>
            );
          })}
        </Row>
      </Form>
    </Modal>
  );
}
