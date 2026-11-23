import { useState } from 'react';
import { Col, DatePicker, Form, Input, Modal, Row, Select, Space, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { InlineAlert, notify } from '@/shared/notifications';
import { InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useCreateSupportTicketMutation,
  useGetSupportCategoriesQuery,
  useGetSupportPrioritiesQuery,
  useUploadSupportAttachmentMutation,
} from '../api';
import { useUsersRetrieveQuery } from '@/shared/api/generated/api';
import { usePermission } from '@/features/auth/hooks/useCan';
import { SUPPORT_ATTACHMENT_ACCEPT, SUPPORT_ATTACHMENT_HINT, apiErrorMessage } from '../attachments';
import type { TicketCreatePayload } from '../types';
import { TicketPriorityBadge } from './TicketBadges';

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
  const canManage = usePermission('support.handle');

  const [createTicket] = useCreateSupportTicketMutation();
  const { data: categoriesData, isFetching: isCategoriesFetching, isError: categoriesError } =
    useGetSupportCategoriesQuery({});
  const { data: prioritiesData, isFetching: isPrioritiesFetching, isError: prioritiesError } =
    useGetSupportPrioritiesQuery({});
  const { data: usersData, isFetching: isUsersFetching } = useUsersRetrieveQuery(
    {},
    { skip: !open || !canManage },
  );

  const categoryOptions = (categoriesData?.data ?? []).map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const priorityOptions = (prioritiesData?.data ?? []).map((p) => ({
    value: p.id,
    searchLabel: p.name,
    label: <TicketPriorityBadge priority={p.name} showTooltip={false} />,
  }));

  const watcherOptions = (usersData?.data ?? []).map((u) => ({
    value: u.id,
    label: u.display_name || u.username,
  }));

  const handleFinish = async (values: TicketCreatePayload) => {
    try {
      setSubmitting(true);
      const ticket = await createTicket({
        ...values,
        subject: values.subject.trim(),
        description: values.description.trim(),
        labels: values.labels?.map((label) => label.trim()).filter(Boolean),
        watcher_ids: values.watcher_ids?.length ? values.watcher_ids : undefined,
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
        notify.warning('Support ticket created, but some attachments failed', {
          code: ticketLabel,
          description: `${failed.join(' ')} You can upload them from the ticket page.`,
          duration: 10000,
        });
      } else {
        notify.success('Support ticket created', {
          code: ticketLabel,
        });
      }
      form.resetFields();
      setFiles([]);
      onSuccess();
    } catch (error: unknown) {
      notify.error('Unable to create support ticket', {
        description: apiErrorMessage(error, 'Please review the ticket details and try again.'),
      });
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
        <InlineAlert
          variant="error"
          title="Some ticket options could not be loaded"
          description="Refresh the page or try again shortly. Required options must be available before submitting."
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => void handleFinish(values)}
        style={{ marginTop: 8 }}
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

        <Row gutter={16}>
          <Col xs={24} sm={12}>
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
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Priority"
              name="priority_id"
              tooltip="Optional — priority may be set automatically from impact and urgency."
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
                  String(option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={14}>
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
          </Col>
          <Col xs={24} sm={10}>
            <Form.Item label="Target date" name="due_date" getValueProps={(value) => ({ value: value ? dayjs(value) : null })} getValueFromEvent={(value) => value?.format('YYYY-MM-DD') ?? null}>
              <DatePicker style={{ width: '100%' }} minDate={dayjs()} placeholder="Optional target date" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Labels" name="labels" extra="Add a few keywords to help the team categorize this request.">
          <Select mode="tags" tokenSeparators={[',']} placeholder="e.g. microscope, calibration" />
        </Form.Item>

        {canManage && (
          <Form.Item
            label="Watchers"
            name="watcher_ids"
            extra="Optional — subscribe people to receive updates on this ticket."
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              loading={isUsersFetching}
              placeholder="Select people to notify"
              options={watcherOptions}
            />
          </Form.Item>
        )}

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
