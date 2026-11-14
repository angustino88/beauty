import type { ReactNode } from 'react';
import type { StatusTone } from '@/shared/status/statusTone';
import styles from './DetailPrimitives.module.css';

/**
 * Building blocks for resource detail sheets (spaces and equipment).
 * Every block is theme-token based, so sheets render correctly in light and dark.
 */

export interface HeroFact { label: string; value: ReactNode; tone?: StatusTone }

/** The answer to "what state is this in, and why?" — shown first in every detail sheet. */
export function StatusHero({ tone, eyebrow = 'Current status', title, description, facts = [], icon, aside }: {
  tone: StatusTone;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  facts?: HeroFact[];
  icon?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className={`${styles.hero} ${styles[tone]}`} aria-label="Current status">
      <div className={styles.heroMain}>
        {icon && <span className={styles.heroIcon} aria-hidden="true">{icon}</span>}
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>{eyebrow}</span>
          <strong className={styles.heroTitle}><i className={styles.dot} aria-hidden="true" />{title}</strong>
          {description && <p className={styles.heroDescription}>{description}</p>}
        </div>
        {aside && <div className={styles.heroAside}>{aside}</div>}
      </div>
      {facts.length > 0 && (
        <dl className={styles.heroFacts}>
          {facts.map((fact) => (
            <div key={fact.label} className={fact.tone ? styles[fact.tone] : undefined}>
              <dt>{fact.label}</dt>
              <dd className={fact.tone ? styles.factToned : undefined}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export interface Facet { label: string; value: ReactNode; tone: StatusTone; icon?: ReactNode }

/** The individual dimensions behind the headline status (lifecycle, condition, access…). */
export function FacetGrid({ items }: { items: Facet[] }) {
  if (!items.length) return null;
  return (
    <ul className={styles.facets}>
      {items.map((item) => (
        <li key={item.label} className={`${styles.facet} ${styles[item.tone]}`}>
          <span className={styles.facetLabel}>{item.label}</span>
          <span className={styles.facetValue}>{item.icon ?? <i className={styles.dot} aria-hidden="true" />}{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

const meterTone = (ratio: number): StatusTone => (ratio >= 0.9 ? 'danger' : ratio >= 0.75 ? 'warning' : 'success');

/** Usage against a limit. Colour reflects headroom: green, amber from 75 %, red from 90 %. */
export function MeterStat({ label, used, total, unit = '', detail, higherIsBetter = false }: {
  label: string; used: number; total: number; unit?: string; detail?: ReactNode;
  /** For utilisation-style meters: green when high, amber below 75 %, red below 50 %. */
  higherIsBetter?: boolean;
}) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, used / total)) : 0;
  const tone: StatusTone = higherIsBetter ? (ratio >= 0.75 ? 'success' : ratio >= 0.5 ? 'warning' : 'danger') : meterTone(ratio);
  const pct = Math.round(ratio * 100);
  const suffix = unit ? ` ${unit}` : '';
  return (
    <div className={`${styles.stat} ${styles[tone]}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>
        <strong>{used.toLocaleString()}</strong>
        <span className={styles.statOf}>/ {total.toLocaleString()}{suffix}</span>
        <span className={styles.statPct}>{pct}%</span>
      </span>
      <span className={styles.meter} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span style={{ width: `${pct}%` }} />
      </span>
      {detail && <span className={styles.statDetail}>{detail}</span>}
    </div>
  );
}

export function StatTile({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}><strong>{value}</strong></span>
      {detail && <span className={styles.statDetail}>{detail}</span>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.statGrid}>{children}</div>;
}

export function DetailSection({ title, icon, action, children }: {
  title: string; icon?: ReactNode; action?: ReactNode; children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h3>{icon && <span aria-hidden="true">{icon}</span>}{title}</h3>
        {action && <div className={styles.sectionAction}>{action}</div>}
      </header>
      {children}
    </section>
  );
}

export type Property = readonly [label: string, value: ReactNode];

/** Label/value pairs. Empty values are dropped so sheets never show "Not specified" walls. */
export function PropertyList({ items, columns = 2 }: { items: Array<Property | null | false | undefined>; columns?: 1 | 2 }) {
  const visible = items.filter((item): item is Property => {
    if (!item) return false;
    const value = item[1];
    return value !== null && value !== undefined && value !== '' && value !== false;
  });
  if (!visible.length) return null;
  return (
    <dl className={`${styles.properties} ${columns === 1 ? styles.propertiesSingle : ''}`}>
      {visible.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function NoteBox({ title = 'Note', children }: { title?: string; children: ReactNode }) {
  return (
    <aside className={styles.note}>
      <strong>{title}</strong>
      <p>{children}</p>
    </aside>
  );
}

export function LinkedList({ items }: { items: Array<{ key: string | number; code?: ReactNode; title: ReactNode; meta?: ReactNode }> }) {
  return (
    <ul className={styles.linked}>
      {items.map((item) => (
        <li key={item.key}>
          {item.code && <span className={styles.code}>{item.code}</span>}
          <span className={styles.linkedTitle}>{item.title}</span>
          {item.meta && <span className={styles.linkedMeta}>{item.meta}</span>}
        </li>
      ))}
    </ul>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return <span className={styles.code}>{children}</span>;
}
