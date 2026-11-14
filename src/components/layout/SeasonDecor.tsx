import type { ReactNode } from 'react';
import { LionDanceIcon, SantaReindeerIcon } from '@/components/svg';
import type { SeasonId } from '@/shared/season/seasons';
import styleCss from './layout.module.css';

const ONE = 'var(--lm-season-1)';
const TWO = 'var(--lm-season-2)';

const blossom = (petal: string, heart: string) => (
  <>
    {[0, 72, 144, 216, 288].map((angle) => (
      <circle key={angle} cx="12" cy="5.5" r="4" fill={petal} transform={`rotate(${angle} 12 12)`} />
    ))}
    <circle cx="12" cy="12" r="2.2" fill={heart} />
  </>
);

const snowflake = (colour: string) => (
  <g stroke={colour} strokeWidth="1.6" strokeLinecap="round" fill="none">
    {[0, 60, 120].map((angle) => (
      <path key={angle} d="M12 3v18M12 6l-2.5-2M12 6l2.5-2M12 18l-2.5 2M12 18l2.5 2" transform={`rotate(${angle} 12 12)`} />
    ))}
  </g>
);

const lantern = (colour: string) => (
  <>
    <path d="M12 2v3M12 19v3" stroke={colour} strokeWidth="1.6" strokeLinecap="round" />
    <rect x="6" y="5" width="12" height="14" rx="6" fill={colour} />
    <path d="M12 5v14" stroke="var(--lm-surface)" strokeWidth="1" opacity="0.5" />
  </>
);

const moon = (colour: string) => (
  <>
    <circle cx="12" cy="12" r="9" fill={colour} />
    <circle cx="9" cy="9" r="2" fill="var(--lm-surface)" opacity="0.35" />
    <circle cx="15" cy="14" r="1.4" fill="var(--lm-surface)" opacity="0.35" />
  </>
);

/** [shape, size px, left %, top px, opacity] — a loose, fading scatter. */
type Motif = readonly [ReactNode, number, number, number, number];

const MOTIFS: Record<SeasonId, readonly Motif[]> = {
  tet: [
    [blossom(TWO, ONE), 24, 16, 14, 0.9], [blossom(ONE, TWO), 15, 32, 30, 0.55], [blossom(TWO, ONE), 18, 48, 8, 0.7],
    [blossom(ONE, TWO), 12, 64, 32, 0.5], [blossom(TWO, ONE), 14, 80, 16, 0.6],
  ],
  'mid-autumn': [
    [moon(TWO), 28, 6, 12, 0.95], [lantern(ONE), 22, 26, 22, 0.8], [lantern(TWO), 18, 46, 8, 0.65],
    [lantern(ONE), 16, 66, 26, 0.55], [lantern(TWO), 14, 84, 14, 0.5],
  ],
  christmas: [
    [snowflake(ONE), 22, 16, 14, 0.9], [snowflake(TWO), 14, 32, 32, 0.6], [snowflake(ONE), 18, 48, 8, 0.6],
    [snowflake(TWO), 12, 64, 28, 0.55], [snowflake(ONE), 16, 80, 16, 0.6],
  ],
};

const MASCOTS: Partial<Record<SeasonId, ReactNode>> = {
  tet: <LionDanceIcon />,
  christmas: <SantaReindeerIcon />,
};

/** Decorative strip inside the header: season motifs plus the season's mascot. */
export function SeasonDecor({ season }: { season: SeasonId }) {
  const mascot = MASCOTS[season];
  return (
    <div className={styleCss.seasonStage} aria-hidden="true">
      {mascot ? <span className={styleCss.seasonMascot}>{mascot}</span> : null}
      {MOTIFS[season].map(([shape, size, left, top, opacity], index) => (
        <svg
          key={index}
          className={styleCss.seasonMotif}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          style={{ left: `${left}%`, top, opacity }}
        >
          {shape}
        </svg>
      ))}
    </div>
  );
}
