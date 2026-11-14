import { Html } from '@react-three/drei';

const style: React.CSSProperties = {
    background: 'rgba(15,23,42,0.82)',
    color: '#94a3b8',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    whiteSpace: 'nowrap',
    border: '1px solid rgba(148,163,184,0.25)',
    userSelect: 'none',
};

export function RackDragHint({ name }: { name: string }) {
    return (
        <Html position={[0, 2.6, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={style}>Drag to move {name}</div>
        </Html>
    );
}