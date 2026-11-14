/**
 * Seasonal "packs" for the app header.
 *
 * A season only decorates: it supplies a chip label, a motif and (optionally) a
 * mascot illustration, coloured by the five --lm-season-* tokens that
 * html[data-season] switches in shared/styles/tokens.css. Buttons, links and
 * status colours never change with the season.
 *
 * To add a season: add an entry here, a `html[data-season='<id>']` token block
 * (light + dark) in tokens.css, and a motif in components/layout/SeasonDecor.tsx.
 */
export type SeasonId = 'tet' | 'mid-autumn' | 'christmas';

export interface SeasonDefinition {
  id: SeasonId;
  /** Text on the header chip. */
  label: string;
  /** Inclusive [month, day] window, repeated every year. */
  from: readonly [number, number];
  to: readonly [number, number];
}

/** Lunar festivals move each year, so their windows are deliberately generous. */
export const SEASONS: readonly SeasonDefinition[] = [
  { id: 'tet', label: 'Tet edition', from: [1, 10], to: [2, 25] },
  { id: 'mid-autumn', label: 'Mid-Autumn', from: [9, 1], to: [10, 10] },
  { id: 'christmas', label: 'Xmas edition', from: [12, 1], to: [12, 31] },
];

const ordinal = (month: number, day: number) => month * 100 + day;

/** The season whose window contains `date`, or null between seasons. */
export function seasonForDate(date: Date): SeasonDefinition | null {
  const today = ordinal(date.getMonth() + 1, date.getDate());
  return SEASONS.find(({ from, to }) => today >= ordinal(...from) && today <= ordinal(...to)) ?? null;
}

/**
 * Applies an override on top of the calendar: a season id pins that season,
 * "none" turns decoration off, anything else (including "auto") follows the date.
 */
export function resolveSeason(date: Date, override?: string | null): SeasonDefinition | null {
  const key = override?.trim().toLowerCase();
  if (key === 'none' || key === 'off') return null;
  return SEASONS.find(({ id }) => id === key) ?? seasonForDate(date);
}
