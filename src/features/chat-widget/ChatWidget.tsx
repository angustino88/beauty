import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useChatWebSocket } from './hooks/useChatWebSocket';
import styles from './ChatWidget.module.css';
import {
  FALLBACK_QUICK_ACTIONS,
  isDev,
  SLASH_COMMANDS,
  type SlashCommand,
} from './constants';
import { ChatLauncherButton } from './components/ChatLauncherButton';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessageList } from './components/ChatMessageList';
import { ChatChoices } from './components/ChatChoices';
import { ChatCommandMenu } from './components/ChatCommandMenu';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showCmdMenu, setShowCmdMenu] = useState(false);
  const [forceShowMenu, setForceShowMenu] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    status,
    error,
    choices,
    inputLocked,
    agentStatus,
    connect,
    disconnect,
    sendText,
  } = useChatWebSocket({
    onExit: () => {
      setIsMinimized(false);
      setIsOpen(false);
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentStatus]);

  const isVisible = isOpen && !isMinimized;
  useEffect(() => {
    if (isVisible && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [isVisible]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    connect();
  };

  const handleRestore = () => setIsMinimized(false);
  const handleMinimize = () => setIsMinimized(true);

  const handleClose = () => {
    disconnect();
    setIsMinimized(false);
    setIsOpen(false);
  };

  const filteredCmds = useMemo(() => {
    if (!showCmdMenu) return [];
    return SLASH_COMMANDS.filter((c) =>
      c.command.startsWith(inputValue.toLowerCase()));
  }, [showCmdMenu, inputValue]);

  const hasUserMessage = useMemo(
    () => messages.some((msg) => msg.sender === 'user'),
    [messages],
  );

  const showFallbackActions =
    status === 'connected'
    && (!hasUserMessage || forceShowMenu)
    && (!choices || choices.length === 0);

  const executeCmd = (cmd: SlashCommand) => {
    setShowCmdMenu(false);
    setInputValue('');
    setForceShowMenu(cmd.command === '/menu');
    sendText(cmd.command);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowCmdMenu(value.startsWith('/') && !value.includes('\n'));
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || inputLocked) return;
    setShowCmdMenu(false);
    setForceShowMenu(text.toLowerCase() === '/menu');
    sendText(text);
    setInputValue('');
  };

  const handleChoiceSend = (text: string) => {
    setForceShowMenu(false);
    sendText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showCmdMenu) {
      setShowCmdMenu(false);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showCmdMenu && filteredCmds.length > 0) {
        executeCmd(filteredCmds[0]);
      } else {
        handleSend();
      }
    }
  };

  if (!isOpen || isMinimized) {
    return (
      <ChatLauncherButton
        isMinimized={isMinimized}
        onOpen={handleOpen}
        onRestore={handleRestore}
      />
    );
  }

  return (
    <div className={styles.chatContainer}>
      <ChatHeader
        status={status}
        onMinimize={handleMinimize}
        onClose={handleClose}
      />

      {error && <div className={styles.errorBanner}>{error}</div>}

      <ChatMessageList
        status={status}
        messages={messages}
        agentStatus={agentStatus}
        listRef={listRef}
        endRef={endRef}
        isDev={isDev}
      />

      <ChatChoices
        choices={choices}
        showFallbackActions={showFallbackActions}
        fallbackActions={FALLBACK_QUICK_ACTIONS}
        onSend={handleChoiceSend}
      />

      <ChatCommandMenu
        visible={showCmdMenu}
        commands={filteredCmds}
        onExecute={executeCmd}
      />

      <div className={styles.inputContainer}>
        <Input.TextArea
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoSize={{ minRows: 1, maxRows: 4 }}
          placeholder={
            inputLocked && choices
              ? 'Please select an option above'
              : 'Type a message… or / for commands'
          }
          disabled={inputLocked || status !== 'connected'}
          className={styles.input}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={inputLocked || status !== 'connected' || !inputValue.trim()}
          className={styles.sendButton}
        />
      </div>
    </div>
  );
};
