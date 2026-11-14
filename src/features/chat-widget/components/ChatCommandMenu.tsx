import React from 'react';
import type { SlashCommand } from '../constants';
import styles from '../ChatWidget.module.css';

interface ChatCommandMenuProps {
  visible: boolean;
  commands: SlashCommand[];
  onExecute: (cmd: SlashCommand) => void;
}

export const ChatCommandMenu: React.FC<ChatCommandMenuProps> = ({
  visible,
  commands,
  onExecute,
}) => {
  if (!visible || commands.length === 0) return null;

  return (
    <div className={styles.commandMenu}>
      {commands.map((cmd) => (
        <button
          key={cmd.command}
          className={styles.commandItem}
          onClick={() => onExecute(cmd)}
          type="button"
        >
          <span className={styles.commandIcon}>{cmd.icon}</span>
          <div className={styles.commandText}>
            <span className={styles.commandLabel}>{cmd.command}</span>
            <span className={styles.commandDesc}>{cmd.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
