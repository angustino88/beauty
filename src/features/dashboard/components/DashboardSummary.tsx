import { memo } from 'react';
import { Col, Row } from 'antd';
import type { CSSProperties } from 'react';
import type { DerivedDashboardStats, SummaryStatus } from '../types';
import {
  useSummaryCardStyles,
  VIGNETTE_STYLE,
  GRAIN_STYLE,
  FOLD_CREASE_STYLE,
  COLOR_TAB_BASE,
  HAIRLINE_BASE,
  CARD_CONTENT_STYLE,
  HEADER_ROW_STYLE,
  LABEL_STYLE,
  CLICK_HINT_STYLE,
  NUMBER_ROW_STYLE,
  NUMBER_STYLE,
} from './DashboardSummary.styles';

type StatDef = {
  label: string;
  key: keyof DerivedDashboardStats;
  summaryKey: SummaryStatus;
  accent: string;
  stamp: string;
};

const STAT_MAP: StatDef[] = [
  { label: 'Total',       key: 'totalCount',       summaryKey: null,          accent: '#a13a30', stamp: '#6b2620' },
  { label: 'Free',        key: 'freeCount',        summaryKey: 'free',        accent: '#3e8761', stamp: '#2a5f45' },
  { label: 'Active',      key: 'activeCount',      summaryKey: 'active',      accent: '#a13a30', stamp: '#6b2620' },
  { label: 'Inactive',    key: 'inactiveCount',    summaryKey: 'inactive',    accent: '#b8822e', stamp: '#85621d' },
  { label: 'Maintaining', key: 'maintainingCount', summaryKey: 'maintaining', accent: '#1d8a98', stamp: '#0e5b65' },
  { label: 'Offline',     key: 'offlineCount',     summaryKey: 'offline',     accent: '#6b625f', stamp: '#433d3b' },
];

interface DashboardSummaryProps {
  stats: DerivedDashboardStats;
  activeSummary: SummaryStatus;
  onSummaryClick: (key: SummaryStatus) => void;
}

// RC-11 fix: memo prevents the 6 stat cards from re-rendering when Dashboard
// re-renders due to unrelated state (e.g. pagination page change, search input).
// Props are shallow-stable thanks to statusKey dep on derivedStats (RC-9 fix).
export const DashboardSummary = memo(function DashboardSummary({ stats, activeSummary, onSummaryClick }: DashboardSummaryProps) {
  const { styles } = useSummaryCardStyles();

  return (
    <Row gutter={[12, 12]} justify="start" style={{ padding: '8px 0 16px', marginLeft: 0, marginRight: 0 }}>
      {STAT_MAP.map((stat) => {
        const isActive = activeSummary === stat.summaryKey;
        const number = stats[stat.key];

        // Dynamic styles that depend on per-card accent/stamp colors or isActive state.
        const cardStyle: CSSProperties = {
          background: 'linear-gradient(180deg, var(--lm-paper-top) 0%, var(--lm-paper-bottom) 100%)',
          borderRadius: 16,
          padding: 16,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 136,
          border: `1px solid color-mix(in srgb, var(--lm-paper-edge) ${isActive ? 55 : 30}%, transparent)`,
          boxShadow: isActive
            ? '0 18px 40px rgba(31, 24, 18, 0.24)'
            : '0 12px 26px rgba(31, 24, 18, 0.14)',
          transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
        };

        const colorTabStyle: CSSProperties = {
          ...COLOR_TAB_BASE,
          background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${stat.accent} 14%, ${stat.accent} 86%, rgba(0,0,0,0) 100%)`,
          opacity: isActive ? 1 : 0.82,
        };

        const hairlineStyle: CSSProperties = {
          ...HAIRLINE_BASE,
          opacity: isActive ? 0.65 : 0.45,
        };

        const selectedStampStyle: CSSProperties = {
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: 10,
          transform: 'rotate(-8deg)',
          color: 'color-mix(in srgb, var(--lm-paper-highlight) 95%, transparent)',
          background: `linear-gradient(180deg, ${stat.stamp} 0%, rgba(0,0,0,0.20) 100%)`,
          border: '1px solid color-mix(in srgb, var(--lm-paper-highlight) 22%, transparent)',
          boxShadow: '0 10px 18px rgba(0,0,0,0.28)',
          textShadow: '0 1px 0 rgba(0,0,0,0.20)',
        };

        const colorDotStyle: CSSProperties = {
          width: 14,
          height: 14,
          borderRadius: 999,
          background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, var(--lm-paper-highlight) 35%, transparent), rgba(0,0,0,0) 55%), ${stat.accent}`,
          boxShadow: 'inset 0 2px 0 color-mix(in srgb, var(--lm-paper-highlight) 25%, transparent), inset 0 -2px 0 rgba(0,0,0,0.20)',
          opacity: isActive ? 1 : 0.70,
          flex: '0 0 auto',
        };

        return (
          <Col key={stat.key} xs={12} sm={8} md={6} lg={4} xl={4} style={{ display: 'flex' }}>
            <button
              type="button"
              onClick={() => onSummaryClick(isActive ? null : stat.summaryKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSummaryClick(isActive ? null : stat.summaryKey);
                }
              }}
              className={styles.paperStatBtn}
              aria-pressed={isActive}
              aria-label={`Filter by ${stat.label}`}
            >
              <div className="paperCard" style={cardStyle}>
                <div aria-hidden style={VIGNETTE_STYLE} />
                <div aria-hidden style={GRAIN_STYLE} />
                <div aria-hidden style={FOLD_CREASE_STYLE} />
                <div aria-hidden style={colorTabStyle} />
                <div aria-hidden style={hairlineStyle} />

                <div style={CARD_CONTENT_STYLE}>
                  <div style={HEADER_ROW_STYLE}>
                    <div style={LABEL_STYLE}>{stat.label}</div>
                    {isActive
                      ? <div style={selectedStampStyle}>Selected</div>
                      : <div style={CLICK_HINT_STYLE}>Click to filter</div>
                    }
                  </div>

                  <div style={NUMBER_ROW_STYLE}>
                    <div style={NUMBER_STYLE}>{number}</div>
                    <div aria-hidden style={colorDotStyle} />
                  </div>
                </div>
              </div>
            </button>
          </Col>
        );
      })}
    </Row>
  );
});
