import { theme } from '../../theme';
import { RACK_THRESHOLDS } from '../../config/rackThresholds';
import type { RackData } from '../../types';

const TEMP_MAX = RACK_THRESHOLDS.temperature.critical;
const HUMID_MAX = RACK_THRESHOLDS.humidity.critical;
const POWER_MAX = RACK_THRESHOLDS.power.critical;

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    return (
        <div style={{ flex: 1, height: '5px', background: theme.trackBg, borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(value / max, 1) * 100}%`, height: '100%', background: color, borderRadius: '2px' }} />
        </div>
    );
}

function MetricRow({ icon, value, barValue, barMax, barColor }: { icon: string; value: string; barValue: number; barMax: number; barColor: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '10px', width: '14px', flexShrink: 0 }}>{icon}</span>
            <span style={{ fontFamily: theme.font, fontSize: '9px', fontWeight: 700, color: theme.text, width: '44px', flexShrink: 0, letterSpacing: '0.04em' }}>
                {value}
            </span>
            <MiniBar value={barValue} max={barMax} color={barColor} />
        </div>
    );
}

export function RackCard({ rack }: { rack: RackData }) {
    const { status } = rack;
    const badgeColor = status === 'ok' ? theme.ok : status === 'warning' ? theme.warn : theme.crit;

    return (
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.divider}`, borderRadius: '3px', padding: '7px 10px', marginBottom: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <div>
                    <div style={{ fontFamily: theme.font, fontSize: '11px', fontWeight: 700, color: theme.text, letterSpacing: '0.06em' }}>
                        {rack.name}
                    </div>
                    <div style={{ fontFamily: theme.font, fontSize: '7px', letterSpacing: '0.08em', color: theme.label, marginTop: '1px', minHeight: '7px' }}>
                        {[rack.manufacturer, rack.model].filter(Boolean).join(' · ')}
                    </div>
                </div>
                <span style={{ fontFamily: theme.font, fontSize: '8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', borderRadius: '3px', padding: '2px 5px', background: badgeColor }}>
                    {status === 'ok' ? 'OK' : status === 'warning' ? 'WARN' : 'CRIT'}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <MetricRow icon="🌡" value={`${rack.temperature.toFixed(1)}°C`} barValue={rack.temperature} barMax={TEMP_MAX} barColor={theme.accent} />
                <MetricRow icon="💧" value={`${rack.humidity.toFixed(0)}%`} barValue={rack.humidity} barMax={HUMID_MAX} barColor={theme.humid} />
                <MetricRow icon="⚡" value={`${rack.powerUsage.toFixed(1)}KW`} barValue={rack.powerUsage} barMax={POWER_MAX} barColor={theme.power} />
            </div>
        </div>
    );
}
