import { theme } from '../../theme';
import { upperLabel } from '../../styles';

interface StatBlockProps {
    label: string;
    value: string | number;
    valueColor?: string;
    valueSize?: string;
    unit?: string;
}

export function StatBlock({ label, value, valueColor = theme.text, valueSize = '18px', unit }: StatBlockProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
            <span style={{ ...upperLabel, letterSpacing: '0.15em' }}>{label}</span>
            <span style={{ fontFamily: theme.font, fontSize: valueSize, fontWeight: 700, color: valueColor, letterSpacing: '0.04em', lineHeight: 1 }}>
                {value}
                {unit && (
                    <span style={{ fontSize: '11px', marginLeft: '3px', color: valueColor, fontWeight: 400 }}>
                        {unit}
                    </span>
                )}
            </span>
        </div>
    );
}