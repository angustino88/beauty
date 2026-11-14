/**
 * SsoLoginPage.styles.ts
 *
 * WHY createStyles here (not inline or CSS modules):
 * - The card/button use Ant Design design tokens (colorBgContainer, colorPrimary,
 *   borderRadiusLG, etc.) for theme consistency — only resolvable at runtime.
 * - Static layout values (minHeight, flex centering) are plain CSSProperties
 *   constants to avoid unnecessary runtime class generation.
 */

import { createStyles } from 'antd-style';
import type { CSSProperties } from 'react';

export const useLoginStyles = createStyles(({ css, token }) => ({
  card: css`
    width: min(440px, calc(100vw - 32px));
    border-radius: ${token.borderRadiusLG}px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10);
    background: ${token.colorBgContainer};
  `,

  logoBrand: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 20px;
  `,

  tagline: css`
    color: ${token.colorTextSecondary};
    font-size: 12px;
    text-align: center;
    margin-top: -12px;
    margin-bottom: 20px;
  `,

  title: css`
    font-size: 20px;
    font-weight: 700;
    color: ${token.colorText};
    text-align: center;
    margin-bottom: 4px;
    letter-spacing: 0.3px;
  `,

  subtitle: css`
    font-size: 13px;
    color: ${token.colorTextSecondary};
    text-align: center;
    margin-bottom: 24px;
  `,

  actionArea: css`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60px;
  `,

  errorBox: css`
    margin-top: 16px;
    padding: 10px 14px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorErrorBg};
    border: 1px solid ${token.colorErrorBorder};
    color: ${token.colorError};
    font-size: 13px;
    word-break: break-word;
  `,

  restrictedContent: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  `,

  restrictedIcon: css`
    position: relative;
    display: grid;
    place-items: center;
    width: 80px;
    height: 80px;
    margin: 8px 0 20px;
    border-radius: 50%;
    font-size: 34px;
    overflow: hidden;
  `,

  lockImage: css`
    width: 80px;
    height: 80px;
    object-fit: contain;
  `,

  restrictedIconBadge: css`
    position: absolute;
    right: -3px;
    bottom: 1px;
    color: var(--lm-danger-fg);
    background: var(--lm-danger-bg);
    border-radius: 50%;
    font-size: 20px;
  `,

  restrictedTitle: css`
    margin: 0 0 12px;
    color: var(--lm-text);
    font-size: 26px;
    font-weight: 700;
    line-height: 1.25;
  `,

  restrictedDescription: css`
    max-width: 350px;
    margin: 0;
    color: var(--lm-text-secondary);
    font-size: 14px;
    line-height: 1.6;
  `,

  contentDivider: css`
    width: 100%;
    height: 1px;
    margin: 24px 0;
    background: var(--lm-surface-muted);
  `,

  tryAgainButton: css`
    width: 100%;
    height: 44px;
    border: 0;
    border-radius: 999px;
    color: var(--lm-on-primary);
    background: var(--lm-primary);
    font-weight: 600;

    &:hover,
    &:focus {
      background: var(--lm-primary) !important;
      color: #fff !important;
    }
  `,

  helpFooter: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 24px;
    color: var(--lm-text-secondary);
    font-size: 12px;

    .anticon {
      color: var(--lm-text-tertiary);
      font-size: 15px;
    }

    a {
      color: var(--lm-primary);
      text-decoration: underline;
    }
  `,
}));

export const PAGE_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: 'var(--lm-bg)',
};

export const DIVIDER_STYLE: CSSProperties = {
  height: 1,
  background: 'rgba(0,0,0,0.06)',
  margin: '0 -24px 20px',
};
