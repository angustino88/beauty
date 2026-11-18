import { useState } from 'react';
import { Alert, DatePicker, Form, Input, Modal, Select, Space, Typography, Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useCreateSupportTicketMutation,
  useGetSupportCategoriesQuery,
  useGetSupportPrioritiesQuery,
  useUploadSupportAttachmentMutation,
} from '../api';
import { SUPPORT_ATTACHMENT_ACCEPT, SUPPORT_ATTACHMENT_HINT, apiErrorMessage } from '../attachments';
import type { TicketCreatePayload } from '../types';

interface CreateSupportTicketModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export function CreateSupportTicketModal({
  open,
  onCancel,
  onSuccess,
}: CreateSupportTicketModalProps) {
  const [form] = Form.useForm<TicketCreatePayload>();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadAttachment] = useUploadSupportAttachmentMutation();

  const [createTicket] = useCreateSupportTicketMutation();
  const { data: categoriesData, isFetching: isCategoriesFetching, isError: categoriesError } =
    useGetSupportCategoriesQuery({});
  const { data: prioritiesData, isFetching: isPrioritiesFetching, isError: prioritiesError } =
    useGetSupportPrioritiesQuery({});

  const categoryOptions = (categoriesData?.data ?? []).map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const priorityOptions = (prioritiesData?.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const handleFinish = async (values: TicketCreatePayload) => {
    try {
      setSubmitting(true);
      const ticket = await createTicket({
        ...values,
        subject: values.subject.trim(),
        description: values.description.trim(),
        labels: values.labels?.map((label) => label.trim()).filter(Boolean),
        due_date: values.due_date || null,
      }).unwrap();

      const ticketLabel = ticket.key || `#${ticket.id}`;
      const selected = files.flatMap((entry) => (entry.originFileObj ? [entry.originFileObj] : []));
      const failed: string[] = [];
      for (const file of selected) {
        try {
          await uploadAttachment({ key: ticket.key, file }).unwrap();
        } catch (error) {
          failed.push(`${file.name}: ${apiErrorMessage(error)}`);
        }
      }

      if (failed.length) {
        void message.warning(
          `Ticket ${ticketLabel} created, but ${failed.length} file(s) were not attached. ${failed.join(' ')} You can add them from the ticket page.`,
          10,
        );
      } else {
        void message.success(`Ticket ${ticketLabel} created successfully!`);
      }
      form.resetFields();
      setFiles([]);
      onSuccess();
    } catch (error: unknown) {
      void message.error(`Error: ${apiErrorMessage(error, 'Failed to create support ticket')}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOk = async () => {
    try {
      await form.validateFields();
      form.submit();
    } catch {
      // Form validation failed
    }
  };

  return (
    <Modal
    title="Create support ticket"
      open={open}
      onCancel={() => {
        form.resetFields();
        setFiles([]);
        onCancel();
      }}
      onOk={() => void handleOk()}
      confirmLoading={submitting}
      okText="Submit ticket"
      cancelText="Cancel"
      destroyOnHidden
      width={680}
      style={{ top: 32 }}
      styles={{ body: { maxHeight: 'calc(100vh - 170px)', overflowY: 'auto' } }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Share the details our lab support team needs to route and resolve your request.
      </Typography.Paragraph>
      {(categoriesError || prioritiesError) && (
        <Alert
          type="error"
          showIcon
          message="Some ticket options could not be loaded"
          description="Refresh the page or try again shortly. Required options must be available before submitting."
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => void handleFinish(values)}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label="Subject"
          name="subject"
          rules={[
            { required: true, whitespace: true, message: 'Please enter a ticket subject' },
            { max: 200, message: 'Subject must not exceed 200 characters' },
          ]}
        >
          <Input placeholder="Brief summary of the issue or request" maxLength={200} showCount />
        </Form.Item>

        <Form.Item
          label="Category"
          name="category_id"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select
            placeholder="Select category"
            loading={isCategoriesFetching}
            disabled={isCategoriesFetching || categoryOptions.length === 0}
            notFoundContent={isCategoriesFetching ? 'Loading categories…' : 'No categories available'}
            options={categoryOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="Priority"
          name="priority_id"
          extra="Optional — priority may be set automatically from impact and urgency."
          getValueFromEvent={(value) => value ?? null}
        >
          <Select
            placeholder="Select priority (optional)"
            loading={isPrioritiesFetching}
            allowClear
            disabled={isPrioritiesFetching || priorityOptions.length === 0}
            notFoundContent={isPrioritiesFetching ? 'Loading priorities…' : 'No priorities available'}
            options={priorityOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item label="Request type" name="ticket_type" initialValue="incident">
          <Select
            options={[
              { value: 'incident', label: 'Incident — something is not working' },
              { value: 'service_request', label: 'Service request — access, equipment, or assistance' },
              { value: 'problem', label: 'Problem — recurring or underlying issue' },
              { value: 'change', label: 'Change — planned modification' },
              { value: 'question', label: 'Question — guidance or information' },
            ]}
          />
        </Form.Item>

        <Form.Item label="Target date" name="due_date" getValueProps={(value) => ({ value: value ? dayjs(value) : null })} getValueFromEvent={(value) => value?.format('YYYY-MM-DD') ?? null}>
          <DatePicker style={{ width: '100%' }} minDate={dayjs()} placeholder="Optional" />
        </Form.Item>

        <Form.Item label="Labels" name="labels" extra="Add a few keywords to help the team categorize this request.">
          <Select mode="tags" tokenSeparators={[',']} placeholder="e.g. microscope, calibration" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { required: true, whitespace: true, message: 'Please add a description' },
            { max: 10000, message: 'Description must not exceed 10,000 characters' },
          ]}
        >
          <Input.TextArea
            rows={6}
            maxLength={10000}
            placeholder="What happened or what do you need? Include the equipment or lab location, impact, troubleshooting already tried, and any steps to reproduce."
            showCount
          />
        </Form.Item>

        <Form.Item label="Attachments" extra={SUPPORT_ATTACHMENT_HINT}>
          <Upload.Dragger
            multiple
            accept={SUPPORT_ATTACHMENT_ACCEPT}
            fileList={files}
            beforeUpload={() => false}
            onChange={({ fileList }) => setFiles(fileList)}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Click or drag screenshots, photos or documents here</p>
          </Upload.Dragger>
        </Form.Item>
      </Form>
      </Space>
    </Modal>
  );
}
