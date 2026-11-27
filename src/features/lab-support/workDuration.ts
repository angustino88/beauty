export const MIN_WORK_LOG_MINUTES = 1;
export const MAX_WORK_LOG_MINUTES = 14400; // 240h (30 work days / 6 work weeks / 1.5 work months)

/**
 * Work-time unit scale (Jira-style):
 *   1m  = 1 minute
 *   1h  = 60 minutes
 *   1d  = 8 hours  (480 minutes)
 *   1w  = 5 days   (40 hours / 2,400 minutes)
 *   1mo = 4 weeks  (20 days / 160 hours / 9,600 minutes)
 */
export const WORK_UNIT_MINUTES = {
  m: 1,
  h: 60,
  d: 8 * 60,
  w: 5 * 8 * 60,
  mo: 4 * 5 * 8 * 60,
} as const;

export type WorkDurationUnit = keyof typeof WORK_UNIT_MINUTES;

export interface DurationOption {
  label: string;
  value: string;
  minutes: number;
  hint?: string;
}

export const QUICK_DURATION_PRESETS: readonly DurationOption[] = [
  { label: '15m', value: '15m', minutes: 15 },
  { label: '30m', value: '30m', minutes: 30 },
  { label: '1h', value: '1h', minutes: 60 },
  { label: '2h', value: '2h', minutes: 120 },
  { label: '4h', value: '4h', minutes: 240 },
  { label: '1d', value: '1d', minutes: WORK_UNIT_MINUTES.d, hint: '8h' },
  { label: '1w', value: '1w', minutes: WORK_UNIT_MINUTES.w, hint: '40h' },
  { label: '1mo', value: '1mo', minutes: WORK_UNIT_MINUTES.mo, hint: '160h' },
];

export type ParsedWorkDuration =
  | {
      ok: true;
      minutes: number;
      rounded: boolean;
      bareMinutes: boolean;
      breakdown: string;
      hoursLabel: string;
    }
  | {
      ok: false;
      code: 'empty' | 'bare_decimal' | 'invalid_clock' | 'invalid' | 'too_small' | 'too_large';
      message: string;
      minutes?: number;
    };

const UNIT_ALIASES: Record<string, WorkDurationUnit> = {
  m: 'm',
  min: 'm',
  mins: 'm',
  minute: 'm',
  minutes: 'm',
  h: 'h',
  hr: 'h',
  hrs: 'h',
  hour: 'h',
  hours: 'h',
  d: 'd',
  day: 'd',
  days: 'd',
  w: 'w',
  wk: 'w',
  wks: 'w',
  week: 'w',
  weeks: 'w',
  mo: 'mo',
  mos: 'mo',
  mth: 'mo',
  mths: 'mo',
  month: 'mo',
  months: 'mo',
};

const ORDERED_UNITS: readonly WorkDurationUnit[] = ['mo', 'w', 'd', 'h', 'm'];

export function formatHoursMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes.toLocaleString()}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours.toLocaleString()}h ${rem}m` : `${hours.toLocaleString()}h`;
}

/**
 * Formats whole minutes into a readable work-time breakdown using
 * mo (160h), w (40h), d (8h), h (1h), and m (1m).
 */
export function formatWorkBreakdown(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0m';
  let remaining = Math.round(minutes);
  const parts: string[] = [];

  for (const unit of ORDERED_UNITS) {
    const size = WORK_UNIT_MINUTES[unit];
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      parts.push(`${count}${unit}`);
      remaining %= size;
    }
  }

  return parts.join(' ') || '0m';
}

function finalizeMinutes(
  rawTotal: number,
  { bareMinutes }: { bareMinutes: boolean },
): ParsedWorkDuration {
  if (!Number.isFinite(rawTotal)) {
    return {
      ok: false,
      code: 'too_large',
      message: 'Maximum is 240h (1mo 2w / 14,400 min) per entry.',
    };
  }

  const roundedMinutes = Math.round(rawTotal);
  const rounded = Math.abs(rawTotal - roundedMinutes) > 1e-9;

  if (roundedMinutes < MIN_WORK_LOG_MINUTES) {
    return {
      ok: false,
      code: 'too_small',
      message: 'Enter at least 1 minute.',
    };
  }

  if (roundedMinutes > MAX_WORK_LOG_MINUTES) {
    return {
      ok: false,
      code: 'too_large',
      minutes: roundedMinutes,
      message: `${formatHoursMinutes(roundedMinutes)} (${roundedMinutes.toLocaleString()} min) exceeds the 240h (1mo 2w / 14,400 min) limit per entry.`,
    };
  }

  return {
    ok: true,
    minutes: roundedMinutes,
    rounded,
    bareMinutes,
    breakdown: formatWorkBreakdown(roundedMinutes),
    hoursLabel: formatHoursMinutes(roundedMinutes),
  };
}

/**
 * Parses flexible duration input into whole minutes.
 *
 * Supported formats:
 * - Plain whole minutes: `45`, `90`
 * - Single or compound work units: `45m`, `1.5h`, `1h 30m`, `1h30m`, `2d`, `1w 2d`, `1mo`, `1.5 months`
 * - Separators: spaces, commas, or `+` (`1w + 2d`, `2h, 30m`)
 * - Clock notation: `1:30`, `0:45`
 */
export function parseSmartDuration(raw: string | undefined | null): ParsedWorkDuration {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return {
      ok: false,
      code: 'empty',
      message: 'Enter the time spent (e.g. 45m, 1h 30m, 2d, 1w, 1mo).',
    };
  }

  if (trimmed.includes('-')) {
    return {
      ok: false,
      code: 'too_small',
      message: 'Time spent must be greater than 0.',
    };
  }

  // Plain integer minutes (backward compatible with legacy numeric input)
  if (/^\d+$/.test(trimmed)) {
    return finalizeMinutes(Number(trimmed), { bareMinutes: true });
  }

  // Bare decimal without a unit (e.g. "1.5" while typing "1.5h")
  if (/^(?:\d+\.\d*|\.\d+)$/.test(trimmed)) {
    return {
      ok: false,
      code: 'bare_decimal',
      message: 'Add a unit like 1.5h, 0.5d, or 1.5mo — or enter whole minutes.',
    };
  }

  // Clock notation H:MM
  const clockMatch = /^(\d+):(\d+)$/.exec(trimmed);
  if (clockMatch) {
    const hours = Number(clockMatch[1]);
    const minsStr = clockMatch[2];
    const mins = Number(minsStr);
    if (minsStr.length !== 2 || mins > 59) {
      return {
        ok: false,
        code: 'invalid_clock',
        message: 'Use H:MM with minutes from 00 to 59 (e.g. 1:30).',
      };
    }
    return finalizeMinutes(hours * 60 + mins, { bareMinutes: false });
  }

  // Compound or single unit tokens separated by whitespace, commas, or '+'
  const tokenRegex = /(\d+(?:\.\d+)?|\.\d+)\s*([a-zA-Z]+)/g;
  let totalMinutes = 0;
  let tokenCount = 0;
  let lastIndex = 0;

  for (const match of trimmed.matchAll(tokenRegex)) {
    const start = match.index ?? 0;
    const between = trimmed.slice(lastIndex, start);
    const validSeparator = tokenCount === 0
      ? between.trim() === ''
      : /^[\s,+]*$/.test(between);

    if (!validSeparator) {
      return {
        ok: false,
        code: 'invalid',
        message: 'Use formats like 45m, 1h 30m, 1.5h, 2d, 1w, or 1mo.',
      };
    }

    const amount = Number(match[1]);
    const unitKey = match[2].toLowerCase();
    const unit = UNIT_ALIASES[unitKey];
    if (!unit || !Number.isFinite(amount)) {
      return {
        ok: false,
        code: 'invalid',
        message: 'Use units m, h, d, w, or mo (e.g. 45m, 1h 30m, 2d, 1w, 1mo).',
      };
    }

    totalMinutes += amount * WORK_UNIT_MINUTES[unit];
    tokenCount += 1;
    lastIndex = start + match[0].length;
  }

  if (tokenCount === 0 || trimmed.slice(lastIndex).trim() !== '') {
    return {
      ok: false,
      code: 'invalid',
      message: 'Use formats like 45m, 1h 30m, 1.5h, 2d, 1w, or 1mo.',
    };
  }

  return finalizeMinutes(totalMinutes, { bareMinutes: false });
}

/**
 * When the user types a bare positive number (e.g. "2" or "1.5"), returns
 * smart unit completion options that fit within the single-entry limit.
 */
export function getSmartUnitSuggestions(raw: string | undefined | null): DurationOption[] {
  const trimmed = (raw ?? '').trim();
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(trimmed)) return [];

  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) return [];

  const isWhole = /^\d+$/.test(trimmed);
  const displayAmount = trimmed.startsWith('.') ? `0${trimmed}` : trimmed;
  const units: readonly WorkDurationUnit[] = isWhole
    ? ['m', 'h', 'd', 'w', 'mo']
    : ['h', 'd', 'w', 'mo'];

  const suggestions: DurationOption[] = [];
  for (const unit of units) {
    const minutes = Math.round(amount * WORK_UNIT_MINUTES[unit]);
    if (minutes < MIN_WORK_LOG_MINUTES || minutes > MAX_WORK_LOG_MINUTES) continue;
    const value = `${displayAmount}${unit}`;
    const hoursLabel = formatHoursMinutes(minutes);
    const hint = unit === 'm' || (unit === 'h' && isWhole) ? undefined : hoursLabel;
    suggestions.push({ label: value, value, minutes, hint });
  }
  return suggestions;
}
