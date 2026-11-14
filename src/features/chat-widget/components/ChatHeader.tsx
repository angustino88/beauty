import React from 'react';
import { Badge, Button } from 'antd';
import { CloseOutlined, MinusOutlined } from '@ant-design/icons';
import type { ConnectionStatus } from '../types/chat';
import styles from '../ChatWidget.module.css';

interface ChatHeaderProps {
  status: ConnectionStatus;
  onMinimize: () => void;
  onClose: () => void;
}

const renderStatusBadge = (status: ConnectionStatus) => {
  switch (status) {
    case 'connected':
      return <Badge status="success" text="Connected" />;
    case 'connecting':
      return <Badge status="processing" text="Connecting..." />;
    case 'error':
      return <Badge status="error" text="Error" />;
    default:
      return <Badge status="default" text="Offline" />;
  }
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  status,
  onMinimize,
  onClose,
}) => (
  <div className={styles.header}>
    <div className={styles.headerLeft}>
      <img src="/mango-bot.png" alt="" className={styles.botAvatar} />
      <span className={styles.title}>LabMango Assistant</span>
    </div>
    <div className={styles.headerRight}>
      {renderStatusBadge(status)}
      <Button
        type="text"
        icon={<MinusOutlined />}
        onClick={onMinimize}
        className={styles.headerIconButton}
        aria-label="Minimize"
      />
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={onClose}
        className={styles.headerIconButton}
        aria-label="Close"
      />
    </div>
  </div>
);
