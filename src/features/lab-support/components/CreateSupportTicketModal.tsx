import { useState } from 'react';
import { Col, Collapse, DatePicker, Form, Input, Modal, Row, Select, Upload } from 'antd';
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
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { useCan } from '@/features/auth/hooks/useCan';
import { SUPPORT_ATTACHMENT_ACCEPT, SUPPORT_ATTACHMENT_HINT, apiErrorMessage } from '../attachments';
import type { TicketCreatePayload } from '../types';
import { TicketPriorityBadge } from './TicketBadges';
import { SupportPeopleSelect } from './SupportPeopleSelect';
import { TICKET_TYPE_OPTIONS, getTicketDescriptionPlaceholder } from '../ticketPresentation';
import styles from './SupportTickets.module.css';

interface CreateSupportTicketModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (key: string) => void;
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
  const can = useCan();
  const canManage = can('support.handle') || can('support.administer');
  const { id: currentUserId } = useAuthState();
  const requestType = Form.useWatch('ticket_type', form);

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
    searchLabel: p.name,
    label: <TicketPriorityBadge priority={p.name} showTooltip={false} />,
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
      onSuccess(ticket.key);
    } catch (error: unknown) {
      notify.error('Unable to create support ticket', {
        description: apiErrorMessage(error, 'Please review the ticket details and try again.'),
      });
    } finally {
      setSubmitting(false);
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
      onOk={() => form.submit()}
      confirmLoading={submitting}
      closable={!submitting}
      keyboard={!submitting}
      mask={{ closable: !submitting }}
      cancelButtonProps={{ disabled: submitting }}
      okText="Submit ticket"
      cancelText="Cancel"
      destroyOnHidden
      width={680}
      style={{ top: 24 }}
      styles={{ body: { maxHeight: 'calc(100dvh - 150px)', overflowY: 'auto', paddingInline: 2 } }}
    >
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
        className={styles.createForm}
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
            <Form.Item label="Request type" name="ticket_type" initialValue="incident">
              <Select options={TICKET_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Category"
              name="category_id"
              rules={[{ required: true, message: 'Select a category' }]}
            >
              <Select
                placeholder="Select category"
                loading={isCategoriesFetching}
                disabled={isCategoriesFetching || categoryOptions.length === 0}
                notFoundContent={isCategoriesFetching ? 'Loading categories…' : 'No categories available'}
                options={categoryOptions}
                showSearch={{ optionFilterProp: 'label' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Priority"
              name="priority_id"
              tooltip="Support can adjust the priority during triage."
              getValueFromEvent={(value) => value ?? null}
            >
              <Select
                placeholder="Use default priority"
                loading={isPrioritiesFetching}
                allowClear
                disabled={isPrioritiesFetching || priorityOptions.length === 0}
                options={priorityOptions}
                showSearch={{ optionFilterProp: 'searchLabel' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Target date"
              name="due_date"
              getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
              getValueFromEvent={(value) => value?.format('YYYY-MM-DD') ?? null}
            >
              <DatePicker style={{ width: '100%' }} minDate={dayjs()} placeholder="Select a date" />
            </Form.Item>
          </Col>
        </Row>

        {canManage && (
          <Form.Item label="Assignee" name="assignee_id" extra="Leave blank to keep the ticket unassigned.">
            <SupportPeopleSelect<number>
              assigneesOnly
              allowClear
              suggestIds={currentUserId ? [currentUserId] : []}
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
            rows={4}
            maxLength={10000}
            placeholder={getTicketDescriptionPlaceholder(requestType)}
          />
        </Form.Item>

        {canManage && (
          <Collapse
            size="small"
            className={styles.createOptions}
            items={[{
              key: 'options',
              label: 'Watchers and labels',
              children: (
                <>
                  <Form.Item label="Watchers" name="watcher_ids" extra="Watchers can view the ticket and receive updates.">
                    <SupportPeopleSelect<number[]> mode="multiple" allowClear maxTagCount="responsive" />
                  </Form.Item>
                  <Form.Item label="Labels" name="labels">
                    <Select mode="tags" tokenSeparators={[',']} placeholder="e.g. microscope, calibration" />
                  </Form.Item>
                </>
              ),
            }]}
          />
        )}

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
    </Modal>
  );
}
