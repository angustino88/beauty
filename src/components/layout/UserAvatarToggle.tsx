import { Avatar, Button, Popconfirm, Popover, Upload, Tooltip, message, type UploadProps } from 'antd';
import { CloudUploadOutlined, DeleteOutlined, DownOutlined, LoadingOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import styleCss from './layout.module.css';
import { useUploadAvatarMutation, useRemoveAvatarMutation } from '@/features/auth/api';
import { useLogout } from '@/features/auth/hooks';
import { getAvatarUrl } from '@/shared/utils/avatar';

interface UserAvatarToggleProps {
  username: string;
  displayName: string;
  avatar: string | null;
  collapsed: boolean;
  onUploadSuccess?: (url: string) => void;
  onRemoveSuccess?: () => void;
}

const UserAvatarToggle: React.FC<UserAvatarToggleProps> = ({
  username,
  displayName,
  avatar,
  collapsed,
  onUploadSuccess,
  onRemoveSuccess,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [removeAvatar, { isLoading: removing }] = useRemoveAvatarMutation();
  const { handleFullLogout } = useLogout();

  const avatarSrc = getAvatarUrl(avatar, username);
  const hasRealAvatar = !!avatar;
  const accountName = displayName || username;
  const accountEmail = username.includes('@') ? username : `${username}@bosch.com`;

  const beforeUpload = (file: File): boolean | typeof Upload.LIST_IGNORE | Promise<boolean | typeof Upload.LIST_IGNORE> => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      void message.error('You can only upload JPG/PNG files!');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      void message.error('Image must be smaller than 5MB!');
      return Upload.LIST_IGNORE;
    }

    return new Promise<boolean | typeof Upload.LIST_IGNORE>((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const aspectRatio = img.width / img.height;
        if (aspectRatio < 0.5 || aspectRatio > 2) {
          void message.error('Image aspect ratio must be between 1:2 and 2:1 for avatars!');
          resolve(Upload.LIST_IGNORE);
        } else {
          resolve(true);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        void message.error('Failed to load image!');
        resolve(Upload.LIST_IGNORE);
      };
      img.src = objectUrl;
    });
  };

  const handleCustomRequest: NonNullable<UploadProps['customRequest']> = async (options) => {
    const { onSuccess, onError, file } = options;
    if (!(file instanceof File)) {
      onError?.(new Error('Invalid upload payload'));
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const result = await uploadAvatar(formData).unwrap();
      onUploadSuccess?.(result.avatar);
      onSuccess?.(result.avatar);
      setPopoverOpen(false);
      void message.success('Avatar updated successfully');
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err : new Error('Upload failed'));
      void message.error('Upload failed');
    }
  };

  const handleRemove = async () => {
    try {
      await removeAvatar().unwrap();
      onRemoveSuccess?.();
      setPopoverOpen(false);
      void message.success('Avatar removed successfully');
    } catch {
      void message.error('Failed to remove avatar');
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setPopoverOpen(false);
    await handleFullLogout();
  };

  const avatarNode = (
    <div className={styleCss.userAvatar}>
      <Avatar
        size={44}
        alt={`${accountName} avatar`}
        src={!uploading ? avatarSrc || undefined : undefined}
        icon={uploading ? <LoadingOutlined /> : !avatarSrc ? <UserOutlined /> : undefined}
      />
    </div>
  );

  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload,
    customRequest: handleCustomRequest,
    accept: 'image/png,image/jpeg',
    disabled: uploading || removing,
  };

  const accountMenu = (
    <div className={styleCss.accountMenu}>
      <div className={styleCss.accountMenuHeader}>
        <div className={styleCss.accountMenuAvatar}>
          <Avatar
            size={56}
            alt={`${accountName} avatar`}
            src={!uploading ? avatarSrc || undefined : undefined}
            icon={uploading ? <LoadingOutlined /> : !avatarSrc ? <UserOutlined /> : undefined}
          />
          <span className={styleCss.accountStatusDot} aria-hidden="true" />
        </div>
        <div className={styleCss.accountMenuIdentity}>
          <strong title={accountName}>{accountName}</strong>
          <span title={accountEmail}>{accountEmail}</span>
          <span className={styleCss.accountMenuStatus}>
            <i aria-hidden="true" />
            Signed in
          </span>
        </div>
      </div>
      <div className={styleCss.accountMenuBody}>
        <span className={styleCss.accountMenuSectionLabel}>Profile photo</span>
        <Upload {...uploadProps} className={styleCss.accountMenuUpload}>
          <Button
            className={styleCss.accountMenuAction}
            type="text"
            block
            icon={<CloudUploadOutlined />}
            loading={uploading}
          >
            Change avatar
          </Button>
        </Upload>
        {hasRealAvatar && (
          <Popconfirm
            title="Remove avatar?"
            description="Your generated avatar will be used instead."
            okText="Remove"
            okButtonProps={{ danger: true }}
            onConfirm={handleRemove}
          >
            <Button
              className={styleCss.accountMenuAction}
              type="text"
              block
              danger
              icon={<DeleteOutlined />}
              loading={removing}
            >
              Remove avatar
            </Button>
          </Popconfirm>
        )}
        <div className={styleCss.accountMenuDivider} />
        <span className={styleCss.accountMenuSectionLabel}>Session</span>
        <Button
          className={styleCss.accountMenuAction}
          type="text"
          block
          icon={<LogoutOutlined />}
          loading={loggingOut}
          onClick={() => void handleLogout()}
        >
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`${styleCss.usernameContainer} ${collapsed ? styleCss.usernameContainerCollapsed : ''}`}>
      <Popover
        content={accountMenu}
        trigger="click"
        placement={collapsed ? 'rightBottom' : 'topLeft'}
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        arrow={false}
      >
        <button
          className={`${styleCss.accountTrigger} ${collapsed ? styleCss.accountTriggerCollapsed : ''}`}
          type="button"
          aria-label={`Open account menu for ${accountName}`}
          aria-expanded={popoverOpen}
        >
          {avatarNode}
          {!collapsed && (
            <>
              <div className={styleCss.userIdentity}>
                <Tooltip title={accountName} placement="top">
                  <span className={styleCss.displayName}>{accountName}</span>
                </Tooltip>
                <span className={styleCss.username}>{accountEmail}</span>
              </div>
              <DownOutlined className={styleCss.accountMenuIcon} aria-hidden="true" />
            </>
          )}
        </button>
      </Popover>
    </div>
  );
};

export default React.memo(UserAvatarToggle);
