import { Html } from '@react-three/drei';

interface RackConfirmPanelProps {
    name: string;
    blocked: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const panelStyle: React.CSSProperties = {
    background: 'rgba(15,23,42,0.96)',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#f8fafc',
    fontSize: 12,
    textAlign: 'center',
    minWidth: 140,
    boxShadow: '0 4px 20px rgba(0,0,0,0.55)',
    transition: 'opacity 0.15s',
};

const btn = (bg: string): React.CSSProperties => ({
    background: bg, color: '#fff', border: 'none',
    borderRadius: 4, padding: '4px 14px',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
});

export function RackConfirmPanel({ name, blocked, onConfirm, onCancel }: RackConfirmPanelProps) {
    return (
        <Html
            position={[0, 3.2, 0]}
            center
            style={{ pointerEvents: blocked ? 'none' : 'all' }}
        >
            <div style={{ ...panelStyle, opacity: blocked ? 0.4 : 1 }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>
                    Move <em>{name}</em> here?
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={onConfirm} style={btn('#22c55e')}>Confirm</button>
                    <button onClick={onCancel}  style={btn('#ef4444')}>Cancel</button>
                </div>
            </div>
        </Html>
    );
}