import { useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { CheckOutlined, CopyOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { sectionCommands, type ScriptSection } from './agentModel';
import styles from './ComputingAgent.module.css';

const mask = (secret: string) => `${secret.slice(0, 3)}${'•'.repeat(12)}`;

/**
 * Terminal snippet in the style of CI runner setup pages: a title bar with the shell and Copy,
 * muted comments, unselectable prompts. A `secret` in the text is masked until revealed; Copy
 * always copies the real commands, without comments or prompts.
 */
export function CodeBlock({ section, secret }: { section: ScriptSection; secret?: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const show = (text: string) => (secret && !revealed ? text.split(secret).join(mask(secret)) : text);
  const hasSecret = Boolean(secret) && section.lines.some((line) => secret && line.text.includes(secret));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sectionCommands(section));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      message.error('Copy failed; select the text and copy it manually');
    }
  };

  return (
    <div className={styles.code}>
      <div className={styles.codeBar}>
        <span>{section.shell}</span>
        <span className={styles.codeActions}>
          {hasSecret && (
            <Tooltip title={revealed ? 'Hide grant' : 'Show grant'}>
              <Button
                size="small"
                type="text"
                aria-label={revealed ? 'Hide grant' : 'Show grant'}
                icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setRevealed((value) => !value)}
              />
            </Tooltip>
          )}
          <Button size="small" type="text" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </span>
      </div>
      <pre className={styles.codeBody}>
        {section.lines.map((line, index) => (
          <div key={index} className={line.kind === 'comment' ? styles.codeComment : styles.codeLine}>
            {line.kind === 'command' && <span className={styles.codePrompt} aria-hidden="true">{section.prompt}</span>}
            {show(line.text)}
          </div>
        ))}
      </pre>
    </div>
  );
}
