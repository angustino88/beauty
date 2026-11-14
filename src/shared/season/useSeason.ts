import { useEffect, useMemo } from 'react';
import { resolveSeason, type SeasonDefinition } from './seasons';

/**
 * Current season for the header. Follows the calendar unless VITE_SEASON pins
 * one ("tet" | "mid-autumn" | "christmas" | "none"). Also mirrors the season to
 * html[data-season] so the --lm-season-* tokens switch.
 */
export function useSeason(): SeasonDefinition | null {
  const season = useMemo(
    () => resolveSeason(new Date(), import.meta.env.VITE_SEASON as string | undefined),
    [],
  );

  useEffect(() => {
    const root = document.documentElement;
    if (season) root.dataset.season = season.id;
    else delete root.dataset.season;
    return () => { delete root.dataset.season; };
  }, [season]);

  return season;
}
