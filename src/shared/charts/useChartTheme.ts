import { useMemo } from 'react';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { StatusTone } from '@/shared/status/statusTone';

export interface ChartTheme {
  series: string[];
  grid: string;
  axis: string;
  text: string;
  textMuted: string;
  surface: string;
  border: string;
  tone: Record<StatusTone, string>;
  /** Shared axis props: quiet ticks, no axis lines. */
  axisProps: { tick: { fill: string; fontSize: number }; axisLine: false; tickLine: false };
  gridProps: { stroke: string; strokeDasharray: string; vertical: false };
}

const FALLBACK = ['#0f9f8f', '#e0446d', '#6155d9', '#e3a008', '#2f7fd8', '#9b59d0', '#ec7a2c', '#7a8597'];

/**
 * Resolves the --lm-* chart tokens to literal colours for Recharts (SVG gradient
 * stops and some attributes cannot take var()). Recomputes when the theme flips.
 */
export function useChartTheme(): ChartTheme {
  const { isDark } = useTheme();
  return useMemo(() => {
    const css = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => css?.getPropertyValue(name).trim() || fallback;
    const series = FALLBACK.map((fallback, i) => read(`--lm-chart-${i + 1}`, fallback));
    const axis = read('--lm-chart-axis', '#8a90a2');
    const grid = read('--lm-chart-grid', '#e9ecf2');
    return {
      series,
      grid,
      axis,
      text: read('--lm-text', '#202536'),
      textMuted: read('--lm-text-tertiary', '#717789'),
      surface: read('--lm-surface', '#ffffff'),
      border: read('--lm-border', '#e4e7ee'),
      tone: {
        success: read('--lm-success-solid', '#2f9e62'),
        info: read('--lm-info-solid', '#3b7ddd'),
        violet: read('--lm-violet-solid', '#8a6fdc'),
        warning: read('--lm-warning-solid', '#d48a10'),
        danger: read('--lm-danger-solid', '#d9475a'),
        neutral: read('--lm-neutral-solid', '#8d94a5'),
      },
      axisProps: { tick: { fill: axis, fontSize: 11 }, axisLine: false, tickLine: false },
      gridProps: { stroke: grid, strokeDasharray: '4 6', vertical: false },
    };
    // isDark is the trigger: the computed values change when data-theme flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);
}
