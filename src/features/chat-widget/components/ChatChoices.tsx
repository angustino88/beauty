import React from 'react';
import { Button } from 'antd';
import type { QuickAction } from '../constants';
import styles from '../ChatWidget.module.css';

interface ChatChoicesProps {
  choices: string[] | null;
  showFallbackActions: boolean;
  fallbackActions: QuickAction[];
  onSend: (text: string) => void;
}

export const ChatChoices: React.FC<ChatChoicesProps> = ({
  choices,
  showFallbackActions,
  fallbackActions,
  onSend,
}) => (
  <>
    {choices && choices.length > 0 && (
      <div className={styles.choicesContainer}>
        {choices.map((choice, i) => (
          <Button key={i} onClick={() => onSend(choice)} className={styles.choiceButton}>
            {choice}
          </Button>
        ))}
      </div>
    )}

    {showFallbackActions && (
      <div className={styles.choicesContainer}>
        {fallbackActions.map((action) => (
          <Button
            key={action.label}
            onClick={() => onSend(action.prompt)}
            className={styles.choiceButton}
          >
            {action.label}
          </Button>
        ))}
      </div>
    )}
  </>
);
