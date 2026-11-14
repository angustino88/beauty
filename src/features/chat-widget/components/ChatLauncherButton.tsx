import React from 'react';
import styles from '../ChatWidget.module.css';

interface ChatLauncherButtonProps {
  isMinimized: boolean;
  onOpen: () => void;
  onRestore: () => void;
}

export const ChatLauncherButton: React.FC<ChatLauncherButtonProps> = ({
  isMinimized,
  onOpen,
  onRestore,
}) => (
  <button
    className={`${styles.floatingButton} ${isMinimized ? styles.floatingButtonActive : ''}`}
    onClick={isMinimized ? onRestore : onOpen}
    aria-label="Open LabMango Assistant"
    type="button"
  >
    <span className={styles.floatingImgClip}>
      <img
        src="/mango-bot.png"
        alt="Mango Bot"
        className={styles.floatingBotImg}
      />
    </span>
    {isMinimized && <span className={styles.activeDot} />}
  </button>
);
