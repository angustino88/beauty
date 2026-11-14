import React from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Divider, Spin } from 'antd';
import type { ChatMessageUI, ConnectionStatus } from '../types/chat';
import styles from '../ChatWidget.module.css';

interface AgentStatus {
  status: string;
  node?: string;
}

interface ChatMessageListProps {
  status: ConnectionStatus;
  messages: ChatMessageUI[];
  agentStatus: AgentStatus | null;
  isDev: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
  endRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  status,
  messages,
  agentStatus,
  isDev,
  listRef,
  endRef,
}) => (
  <div className={styles.messageList} ref={listRef}>
    {status === 'connecting' && (
      <div className={styles.loadingContainer}>
        <Spin tip="Connecting..." />
      </div>
    )}

    {messages.map((msg) => (
      <React.Fragment key={msg.id}>
        <div
          className={`${styles.message} ${
            msg.sender === 'user' ? styles.userMessage : styles.botMessage
          }`}
        >
          <div className={styles.messageContent}>{msg.text}</div>
        </div>

        {msg.isComplete && (
          <Divider className={styles.completeDivider}>
            <CheckCircleOutlined /> Resolved
          </Divider>
        )}
      </React.Fragment>
    ))}

    {agentStatus && (
      <div className={styles.thinkingRow}>
        <div className={styles.dots}>
          <span />
          <span />
          <span />
        </div>
        <span className={styles.thinkingText}>{agentStatus.status}</span>
        {isDev && agentStatus.node && (
          <span className={styles.nodeBadge}>{agentStatus.node}</span>
        )}
      </div>
    )}

    <div ref={endRef} />
  </div>
);
