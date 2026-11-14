import { theme } from '../../theme';
import { upperLabel } from '../../styles';

interface StatCardProps {
    label: string;
    value: string | number;
    unit: string;
    subLabel: string;
    valueColor?: string;
}

export function StatCard({ label, value, unit, subLabel, valueColor = theme.text }: StatCardProps) {
    return (
        <div style={{
            flex: 1, background: theme.bgCard,
            border: `1px solid ${theme.divider}`,
            borderTop: `2px solid ${theme.accent}`,
            borderRadius: '3px', padding: '7px 6px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        }}>
            <span style={{ ...upperLabel, fontSize: '8px' }}>{label}</span>
            <span style={{ fontFamily: theme.font, fontSize: '22px', fontWeight: 700, color: valueColor, lineHeight: 1, letterSpacing: '0.02em' }}>
                {value}
                <span style={{ fontSize: '11px', marginLeft: '2px', fontWeight: 400 }}>{unit}</span>
            </span>
            <span style={{ ...upperLabel, fontSize: '7px', letterSpacing: '0.10em', textAlign: 'center' }}>{subLabel}</span>
        </div>
    );
}