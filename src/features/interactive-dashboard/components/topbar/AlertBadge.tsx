import { theme } from '../../theme';
import { upperLabel } from '../../styles';

interface AlertBadgeProps {
    count: number;
    dotColor: string;
    label: string;
}

export function AlertBadge({ count, dotColor, label }: AlertBadgeProps) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: theme.badgeBg, border: `1px solid ${theme.divider}`,
            borderRadius: '4px', padding: '3px 8px',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.10)', minWidth: '56px',
        }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <span style={{ fontFamily: theme.font, fontSize: '12px', fontWeight: 700, color: theme.text, letterSpacing: '0.04em' }}>
                {count}
            </span>
            <span style={{ ...upperLabel, letterSpacing: '0.12em' }}>{label}</span>
        </div>
    );
}