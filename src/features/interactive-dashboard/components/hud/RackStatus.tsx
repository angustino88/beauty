import { useState } from 'react';
import { theme } from '../../theme';
import { type RackStatus as RackStatusType, RACK_THRESHOLDS } from '../../config/rackThresholds';
import { metricStatus } from '../../utils/rackMapper';
import { ensureAnimations } from '../../animations';
import { upperLabel } from '../../styles';
import type { RackStatusProps } from '../../types';
import React from 'react';

// ── Aliases ─────────────────────────────────────────────────────────────────
const FONT = theme.font;

const STATUS_COLOR: Record<RackStatusType, string> = {
    ok: theme.statusOk,
    warning: theme.statusWarn,
    critical: theme.statusCrit,
};

const TEMP_MAX = RACK_THRESHOLDS.temperature.critical;
const HUMID_MAX = RACK_THRESHOLDS.humidity.critical;
const POWER_MAX = RACK_THRESHOLDS.power.critical;

const STATUS_RANK: Record<RackStatusType, number> = { ok: 0, warning: 1, critical: 2 };

// ── Sub-components ────────────────────────────────────────────────────────────
function Divider() {
    return (
        <div style={{
            width: '100%', height: '1px',
            background: theme.divider, margin: '3px 0', flexShrink: 0,
        }} />
    );
}

function MetricBlock({ label, value, unit, pct, barColor }: {
    label: string; value: string; unit: string; pct: number; barColor: string;
}) {
    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ ...upperLabel, fontSize: '7px', letterSpacing: '0.10em' }}>
                {label}
            </span>
            <span style={{
                fontFamily: FONT, fontSize: '13px', fontWeight: 700,
                color: theme.text, lineHeight: 1, letterSpacing: '0.04em',
            }}>
                {value}{' '}
                <span style={{ fontSize: '9px', fontWeight: 400, color: theme.label }}>{unit}</span>
            </span>
            {/* Progress bar */}
            <div style={{
                width: '100%', height: '5px', background: theme.trackBg,
                borderRadius: '3px', overflow: 'hidden',
            }}>
                <div style={{
                    width: `${Math.min(pct, 1) * 100}%`,
                    height: '100%', background: barColor, borderRadius: '3px',
                    transition: 'width 0.4s ease',
                }} />
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export const RackStatus: React.FC<RackStatusProps> = ({ name, temperature, humidity, powerUsage, status, pinned, onTogglePin }) => {
    ensureAnimations();
    const [hovered, setHovered] = useState(false);
    const expanded = pinned || hovered;
    const statusColor = STATUS_COLOR[status];
    const badgeLabel = status === 'ok' ? '● OK' : status === 'warning' ? '● WARN' : '● CRIT';

    // Determine which single metric to show when shrunk: highest-priority wins
    const tempSt = metricStatus(temperature, RACK_THRESHOLDS.temperature);
    const humidSt = metricStatus(humidity, RACK_THRESHOLDS.humidity);
    const powerSt = metricStatus(powerUsage, RACK_THRESHOLDS.power);
    const allMetrics = [
        { label: 'Temperature', value: temperature.toFixed(1), unit: '°C', pct: temperature / TEMP_MAX, barColor: STATUS_COLOR[tempSt], metricStatus: tempSt },
        { label: 'Humidity', value: humidity.toFixed(0), unit: '%', pct: humidity / HUMID_MAX, barColor: STATUS_COLOR[humidSt], metricStatus: humidSt },
        { label: 'Power', value: powerUsage.toFixed(1), unit: 'KW', pct: powerUsage / POWER_MAX, barColor: STATUS_COLOR[powerSt], metricStatus: powerSt },
    ];
    const primaryMetric = [...allMetrics].sort((a, b) => STATUS_RANK[b.metricStatus] - STATUS_RANK[a.metricStatus])[0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* ── Card ── */}
            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    width: 'max-content',
                    minWidth: expanded ? '90px' : '80px',
                    maxWidth: '140px',
                    background: theme.bgCard,
                    border: `1px solid ${theme.divider}`,
                    borderTop: `3px solid ${statusColor}`,
                    borderRadius: '4px',
                    boxShadow: '2px 4px 8px rgba(0,0,0,0.20)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 6px',
                    gap: '4px',
                    transition: 'width 0.25s ease, min-height 0.25s ease',
                    cursor: 'default',
                    pointerEvents: 'all',
                    boxSizing: 'border-box',
                    position: 'relative',
                }}
            >
                {/* Pin button — top-right corner */}
                <button
                    title={pinned ? 'Unpin (allow shrink)' : 'Pin (keep expanded)'}
                    onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                    style={{
                        position: 'absolute', top: '4px', right: '4px',
                        width: '10px', height: '10px',
                        border: 'none', borderRadius: '2px',
                        background: pinned ? theme.divider : 'transparent',
                        cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: pinned ? 1 : 0.4,
                        transition: 'background 0.15s, opacity 0.15s',
                        color: theme.text,
                        pointerEvents: 'all',
                    }}
                >
                    {/* Pin SVG icon */}
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
                        <path d="M6.5 0.5 L8.5 2.5 L6 5 L6.5 7 L5.5 8 L3.5 6 L1 8.5 L0.5 8 L3 5.5 L1 3.5 L2 2.5 L4 3 Z" />
                    </svg>
                </button>
                {/* Rack name */}
                <div style={{
                    fontFamily: FONT, fontSize: '11px', fontWeight: 700,
                    color: theme.text, textTransform: 'uppercase',
                    letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                }}>
                    {name}
                </div>

                <Divider />

                {/* Status badge */}
                <div style={{
                    width: '100%', textAlign: 'center',
                    fontFamily: FONT, fontSize: '8px', fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: '#ffffff',
                    padding: '3px 4px',
                    borderRadius: '2px',
                    background: statusColor,
                    animation: status === 'critical' ? 'crit-pulse 1.4s ease-in-out infinite' : 'none',
                    boxSizing: 'border-box',
                }}>
                    {badgeLabel}
                </div>

                <Divider />

                {/* Shrunk: show only the highest-priority metric; expanded: show all */}
                {expanded ? (
                    allMetrics.map(m => (
                        <MetricBlock key={m.label} label={m.label} value={m.value} unit={m.unit} pct={m.pct} barColor={m.barColor} />
                    ))
                ) : (
                    <MetricBlock label={primaryMetric.label} value={primaryMetric.value} unit={primaryMetric.unit} pct={primaryMetric.pct} barColor={primaryMetric.barColor} />
                )}
            </div>
        </div>
    );
};
