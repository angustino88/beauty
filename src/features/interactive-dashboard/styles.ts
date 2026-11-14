import type { CSSProperties } from 'react';
import { theme } from './theme';

// ── Shared style constants ────────────────────────────────────────────────────
// All reusable inline-style objects and helpers for the interactive dashboard.
// Import in components instead of repeating the same property sets.

/** Small muted uppercase caption. Spread and override fontSize / letterSpacing as needed. */
export const upperLabel: CSSProperties = {
    fontFamily: theme.font,
    fontSize: '9px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: theme.label,
};

/** Section header bar (bgSection background + left accent border + flex row). */
export const sectionRow: CSSProperties = {
    background: theme.bgSection,
    borderLeft: `3px solid ${theme.accent}`,
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '28px',
    flexShrink: 0,
};

/** Small icon toolbar button — for edit-mode toolbars. */
export function iconBtn(disabled = false, active = false): CSSProperties {
    return {
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '22px', height: '22px',
        background: active ? theme.bgCard : 'transparent',
        border: active ? `1px solid ${theme.divider}` : '1px solid transparent',
        borderRadius: '3px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? theme.label : theme.text,
        opacity: disabled ? 0.45 : 1,
        padding: 0, flexShrink: 0,
        transition: 'background 0.15s, border-color 0.15s',
    };
}
