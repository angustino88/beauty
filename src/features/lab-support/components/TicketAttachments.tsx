import { useState } from 'react';
import { Button, Checkbox, Empty, List, Popconfirm, Space, Tag, Tooltip, Typography, Upload } from 'antd';
import { DeleteOutlined, DownloadOutlined, FileOutlined, FileImageOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useSupportTicketsAttachmentsDestroyByKeyAttachmentIdMutation } from '@/shared/api/generated/api';
import { InlineAlert, notify } from '@/shared/notifications';
import { userLabel } from '@/shared/utils/userRef';
import { useDownloadSupportAttachmentMutation, useUploadSupportAttachmentMutation } from '../api';
import {
  SUPPORT_ATTACHMENT_ACCEPT,
  SUPPORT_ATTACHMENT_HINT,
  apiErrorMessage,
  formatFileSize,
  isImageAttachment,
  type SupportAttachment,
} from '../attachments';

interface TicketAttachmentsProps {
  ticketKey: string;
  attachments: SupportAttachment[];
  currentUserId: number | null;
  /** Support agents and administrators: may restrict files and delete any file. */
  canManage: boolean;
  onChanged: () => Promise<unknown> | void;
}

export function TicketAttachments({ ticketKey, attachments, currentUserId, canManage, onChanged }: TicketAttachmentsProps) {
  const [restricted, setRestricted] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [upload] = useUploadSupportAttachmentMutation();
  const [download] = useDownloadSupportAttachmentMutation();
  const [remove] = useSupportTicketsAttachmentsDestroyByKeyAttachmentIdMutation();

  const uploadFile = async (file: File) => {
    setUploading((count) => count + 1);
    try {
      await upload({ key: ticketKey, file, isRestricted: canManage && restricted }).unwrap();
      notify.success('Attachment uploaded', { description: file.name });
      await onChanged();
    } catch (error) {
      notify.error('Unable to upload attachment', {
        description: `${file.name}: ${apiErrorMessage(error)}`,
      });
    } finally {
      setUploading((count) => count - 1);
    }
  };

  const downloadFile = async (attachment: SupportAttachment) => {
    try {
      await download({ attachmentId: attachment.id, filename: attachment.filename }).unwrap();
    } catch (error) {
      notify.error('Unable to download attachment', {
        description: apiErrorMessage(error, 'Please try again.'),
      });
    }
  };

  const deleteFile = async (attachment: SupportAttachment) => {
    try {
      await remove({ key: ticketKey, attachmentId: attachment.id }).unwrap();
      notify.success('Attachment removed', { description: attachment.filename });
      await onChanged();
    } catch (error) {
      notify.error('Unable to remove attachment', {
        description: apiErrorMessage(error, 'Please try again.'),
      });
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {attachments.length ? (
        <List
          size="small"
          dataSource={attachments}
          renderItem={(attachment) => {
            const scan = attachment.scan_status.value;
            const canDownload = scan === 'clean';
            const canDelete = canManage || (currentUserId !== null && attachment.uploaded_by?.id === currentUserId);
            return (
              <List.Item
                actions={[
                  <Tooltip key="download" title={canDownload ? 'Download' : 'Available once the file has been scanned'}>
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      aria-label={`Download ${attachment.filename}`}
                      disabled={!canDownload}
                      onClick={() => void downloadFile(attachment)}
                    />
                  </Tooltip>,
                  ...(canDelete ? [
                    <Popconfirm
                      key="delete"
                      title="Remove this attachment?"
                      okText="Remove"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => deleteFile(attachment)}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Remove ${attachment.filename}`} />
                    </Popconfirm>,
                  ] : []),
                ]}
              >
                <List.Item.Meta
                  avatar={isImageAttachment(attachment) ? <FileImageOutlined /> : <FileOutlined />}
                  title={
                    <Space size={8} wrap>
                      <Typography.Link disabled={!canDownload} onClick={() => void downloadFile(attachment)}>
                        {attachment.filename}
                      </Typography.Link>
                      {attachment.is_restricted && <Tag color="purple">Staff only</Tag>}
                      {scan === 'pending' && <Tag color="gold">Scanning</Tag>}
                      {scan === 'infected' && <Tag color="red">Quarantined</Tag>}
                    </Space>
                  }
                  description={`${formatFileSize(attachment.size)} · ${userLabel(attachment.uploaded_by) || 'User'} · ${new Date(attachment.created_at).toLocaleString()}`}
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No attachments yet" />
      )}

      <Space wrap>
        <Upload
          multiple
          accept={SUPPORT_ATTACHMENT_ACCEPT}
          showUploadList={false}
          beforeUpload={(file) => {
            void uploadFile(file);
            return false;
          }}
        >
          <Button icon={<PaperClipOutlined />} loading={uploading > 0}>Attach files</Button>
        </Upload>
        {canManage && (
          <Checkbox checked={restricted} onChange={(event) => setRestricted(event.target.checked)}>
            Staff only (hidden from the requester)
          </Checkbox>
        )}
      </Space>
      <Typography.Text type="secondary">{SUPPORT_ATTACHMENT_HINT}</Typography.Text>
      {attachments.some((attachment) => attachment.scan_status.value === 'infected') && (
        <InlineAlert
          variant="warning"
          compact
          title="Quarantined attachment cannot be downloaded"
          description="Remove the quarantined file and upload a clean copy."
        />
      )}
    </Space>
  );
}
