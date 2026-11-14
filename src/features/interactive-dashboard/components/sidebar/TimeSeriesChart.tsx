import { useState } from 'react';
import { theme } from '../../theme';

const TIME_LABELS = ['-7h', '-6h', '-5h', '-4h', '-3h', '-2h', '-1h', 'NOW'];
const BAR_AREA_H = 50;

interface TimeSeriesChartProps {
    values: number[];
    max: number;
    barColor: string;
    label: string;
    maxLabel: string;
    warnThreshold?: number;
}

export function TimeSeriesChart({ values, max, barColor, label, maxLabel, warnThreshold }: TimeSeriesChartProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    return (
        <div style={{ padding: '6px 10px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: theme.font, fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: theme.label, fontWeight: 700 }}>
                    {label}
                </span>
                <span style={{ fontFamily: theme.font, fontSize: '9px', color: theme.label }}>
                    {maxLabel}
                </span>
            </div>

            <div style={{ position: 'relative', height: `${BAR_AREA_H}px`, display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
                {warnThreshold !== undefined && (
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(warnThreshold / max) * BAR_AREA_H}px`, borderTop: `1px dashed ${theme.warn}`, zIndex: 2, pointerEvents: 'none' }}>
                        <span style={{ position: 'absolute', right: 0, top: '-8px', fontSize: '6px', color: theme.warn, fontFamily: theme.font, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            WARN
                        </span>
                    </div>
                )}

                {values.map((v, i) => {
                    const isNow = i === 7;
                    const barH = Math.max(Math.min(v / max, 1) * BAR_AREA_H, 2);
                    return (
                        <div
                            key={i}
                            style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', position: 'relative' }}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                        >
                            {hoveredIdx === i && (
                                <div style={{ position: 'absolute', bottom: `${barH + 4}px`, left: '50%', transform: 'translateX(-50%)', background: theme.text, color: theme.bg, fontFamily: theme.font, fontSize: '7px', padding: '3px 5px', borderRadius: '3px', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none', lineHeight: 1.5 }}>
                                    <div style={{ fontWeight: 700 }}>{TIME_LABELS[i]}</div>
                                    <div>avg {v.toFixed(1)}</div>
                                </div>
                            )}
                            <div style={{ width: '100%', height: `${barH}px`, background: barColor, borderRadius: '2px 2px 0 0', opacity: isNow ? 1 : 0.7, filter: hoveredIdx === i ? 'brightness(1.2)' : 'none', transition: 'filter 0.15s ease', cursor: 'default' }} />
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                {TIME_LABELS.map((lbl, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: theme.font, fontSize: '6px', color: i === 7 ? theme.text : theme.label, fontWeight: i === 7 ? 700 : 400, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {lbl}
                    </div>
                ))}
            </div>
        </div>
    );
}
