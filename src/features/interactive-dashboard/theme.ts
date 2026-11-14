// ── Interactive Dashboard — Central Theme ────────────────────────────────────
// All colors, typography and bar-chart palette live here.
// To change the look of the entire dashboard, edit this file only.

export const theme = {

    // ── Typography ────────────────────────────────────────────────────────────
    font: '"Bosch Sans", sans-serif',

    // ── Surface colors ────────────────────────────────────────────────────────
    bg:          '#f5f3ef',   // main surface (topbar, sidebar bg)
    bgSection:   '#eeeae3',   // section header rows
    bgCard:      '#ffffff',   // stat cards, rack cards
    badgeBg:     '#f0e0d2',   // alert badge background (topbar)

    // ── Text colors ───────────────────────────────────────────────────────────
    text:        '#292d33',   // primary — charcoal
    label:       '#6d737b',   // secondary — muted gray

    // ── Structural colors ─────────────────────────────────────────────────────
    border:      '#d0cbc3',   // outer borders (topbar bottom, sidebar edge)
    divider:     '#e1ddd6',   // inner dividers / separators
    trackBg:     '#ded9d1',   // empty bar-chart track

    // ── Semantic / status ─────────────────────────────────────────────────────
    accent:      '#b56732',   // brand, active state, temp bar
    ok:          '#4d8a6a',   // topbar badge / chart line
    warn:        '#b8860b',   // dusty amber        — topbar badge / chart line
    crit:        '#8b3a3a',   // muted brick red    — topbar badge / chart line
    statusOk:    '#38a169',   // vivid green   — rack status card indicator
    statusWarn:  '#d69e2e',   // vivid amber   — rack status card indicator
    statusCrit:  '#e53e3e',   // vivid red     — rack status card indicator
    power:       '#a07820',   // deep ochre / gold — power metric
    humid:       '#4d7f87',   // humidity metric

    // ── FAB (edit toolbar) ────────────────────────────────────────────────────
    fabEdit:         '#2b6cb0',   // edit button (inactive)
    fabEditActive:   '#e53e3e',   // edit button (active / cancel)
    fabSave:         '#38a169',   // save button
    fabDelete:       '#718096',   // delete button (inactive)
    fabDeleteActive: '#e53e3e',   // delete button (active)
    fabDeleteOutline:'#fc8181',   // delete button active outline
    fabAdd:          '#319795',   // add button (enabled)
    fabAddDisabled:  '#a0aec0',   // add button (disabled)
    fabBadge:        '#e53e3e',   // unplaced-count badge on add button

} as const;

export type Theme = typeof theme;
