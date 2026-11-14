// ── Interactive Dashboard — Central Theme ────────────────────────────────────
// All colors, typography and bar-chart palette live here, as references to the
// app's --lm-* tokens so the HUD follows the light/dark theme.
// To change the look of the entire dashboard, edit this file only.

export const theme = {

    // ── Typography ────────────────────────────────────────────────────────────
    font: 'var(--lm-font-sans)',
    bg:          'var(--lm-surface)',
    bgSection:   'var(--lm-surface-subtle)',
    bgCard:      'var(--lm-surface-raised)',
    badgeBg:     'var(--lm-surface-muted)',

    // ── Text colors ───────────────────────────────────────────────────────────
    text:        'var(--lm-text)',
    label:       'var(--lm-text-tertiary)',

    // ── Structural colors ─────────────────────────────────────────────────────
    border:      'var(--lm-border-strong)',
    divider:     'var(--lm-border)',
    trackBg:     'var(--lm-surface-muted)',

    // ── Semantic / status ─────────────────────────────────────────────────────
    accent:      'var(--lm-primary-fg)',
    ok:          'var(--lm-success-solid)',
    warn:        'var(--lm-warning-solid)',
    crit:        'var(--lm-danger-solid)',
    statusOk:    'var(--lm-success-solid)',
    statusWarn:  'var(--lm-warning-solid)',
    statusCrit:  'var(--lm-danger-solid)',
    power:       'var(--lm-warning-fg)',
    humid:       'var(--lm-reserved-solid)',

    // ── FAB (edit toolbar) ────────────────────────────────────────────────────
    fabEdit:         'var(--lm-info-solid)',
    fabEditActive:   'var(--lm-danger-solid)',
    fabSave:         'var(--lm-success-solid)',
    fabDelete:       'var(--lm-neutral-solid)',
    fabDeleteActive: 'var(--lm-danger-solid)',
    fabDeleteOutline:'var(--lm-danger-border)',
    fabAdd:          'var(--lm-primary)',
    fabAddDisabled:  'var(--lm-text-disabled)',
    fabBadge:        'var(--lm-danger-solid)',

} as const;

export type Theme = typeof theme;
