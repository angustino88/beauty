/**
 * DashboardSummary.styles.ts
 *
 * WHY createStyles (not CSS modules):
 * - Interactive state rules (.paperStatBtn:hover/focus-visible/.paperCard) use
 *   Ant Design design token (`token.colorPrimaryBorder`) resolved at runtime —
 *   build-time CSS modules cannot access it.
 * - Nested selector `.paperCard` inside the scoped class requires CSS-in-JS so
 *   the parent–child relationship is correctly scoped and not globally polluted.
 *
 * WHY static CSSProperties constants (not createStyles):
 * - Decorative layer styles (vignette, grain, fold crease) are 100% static with
 *   no token references. Defining them as typed constants avoids unnecessary
 *   runtime class generation while keeping all styles co-located in this file.
 * - Per-card dynamic styles (color tab, hairline, selected stamp, color dot)
 *   depend on per-card accent/stamp colors and the `isActive` flag — they live
 *   in the component but are built on base constants defined here.
 */

import { createStyles } from 'antd-style';
import type { CSSProperties } from 'react';

export const useSummaryCardStyles = createStyles(({ css, token }) => ({
  paperStatBtn: css`
    width: 100%;
    text-align: left;
    border: none;
    padding: 0;
    background: transparent;
    cursor: pointer;

    &:hover .paperCard {
      transform: translateY(-2px);
    }

    &:active .paperCard {
      transform: translateY(0px);
    }

    &:focus-visible .paperCard {
      outline: none;
      box-shadow: 0 0 0 3px ${token.colorPrimaryBorder}, 0 18px 40px rgba(31, 24, 18, 0.18);
    }

    @media (prefers-reduced-motion: reduce) {
      .paperCard {
        transition: none !important;
      }
    }
  `,
}));

// ── Fully-static decorative layer styles ────────────────────────────────────
// These are aria-hidden cosmetic layers (paper texture, vignette, fold crease).
// No token references → plain CSSProperties, zero runtime overhead.

export const VIGNETTE_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(120% 90% at 30% 10%, color-mix(in srgb, var(--lm-paper-highlight) 70%, transparent) 0%, color-mix(in srgb, var(--lm-paper-highlight) 0%, transparent) 55%), ' +
    'radial-gradient(120% 90% at 85% 115%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 60%)',
  pointerEvents: 'none',
};

export const GRAIN_STYLE: CSSProperties = {
  position: 'absolute',
  inset: -80,
  opacity: 0.10,
  background:
    'repeating-linear-gradient(0deg, rgba(0,0,0,0.9) 0px, rgba(0,0,0,0.9) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 8px)',
  transform: 'rotate(-2deg)',
  pointerEvents: 'none',
  mixBlendMode: 'multiply',
};

export const FOLD_CREASE_STYLE: CSSProperties = {
  position: 'absolute',
  left: -40,
  right: -40,
  top: 66,
  height: 1,
  background: 'color-mix(in srgb, var(--lm-paper-edge) 10%, transparent)',
  boxShadow: '0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 55%, transparent)',
  transform: 'rotate(-1deg)',
  pointerEvents: 'none',
};

// ── Base styles for per-card dynamic elements ─────────────────────────────
// These are spread into the final style object in the component; dynamic parts
// (accent color, opacity, isActive flag) are merged on top.

export const COLOR_TAB_BASE: CSSProperties = {
  position: 'absolute',
  left: 10,
  right: 10,
  top: 10,
  height: 16,
  borderRadius: 10,
  boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 30%, transparent), 0 1px 0 rgba(0,0,0,0.10)',
};

export const HAIRLINE_BASE: CSSProperties = {
  position: 'absolute',
  left: 14,
  right: 14,
  top: 28,
  height: 1,
  background: 'color-mix(in srgb, var(--lm-paper-ink) 16%, transparent)',
};

// ── Static content area styles ────────────────────────────────────────────

export const CARD_CONTENT_STYLE: CSSProperties = {
  position: 'relative',
  paddingTop: 14,
};

export const HEADER_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
};

export const LABEL_STYLE: CSSProperties = {
  fontSize: 14,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: 'color-mix(in srgb, var(--lm-paper-ink) 76%, transparent)',
  fontWeight: 800,
};

export const CLICK_HINT_STYLE: CSSProperties = {
  fontSize: 11,
  color: 'color-mix(in srgb, var(--lm-paper-ink) 48%, transparent)',
};

export const NUMBER_ROW_STYLE: CSSProperties = {
  marginTop: 16,
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
};

export const NUMBER_STYLE: CSSProperties = {
  fontSize: 34,
  lineHeight: '38px',
  fontWeight: 950,
  letterSpacing: '-0.05em',
  color: 'color-mix(in srgb, var(--lm-paper-ink) 92%, transparent)',
  textShadow: '0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 70%, transparent)',
  fontVariantNumeric: 'tabular-nums',
};
