import { theme } from '../../theme';

interface ArrowBtnProps {
    direction: 'left' | 'right';
    onClick?: () => void;
}

export function ArrowBtn({ direction, onClick }: ArrowBtnProps) {
    return (
        <button
            title={direction === 'left' ? 'Previous room' : 'Next room'}
            onClick={onClick}
            style={{
                background: 'transparent', border: `1px solid ${theme.divider}`,
                borderRadius: '3px', color: theme.label, fontSize: '16px',
                width: '22px', height: '22px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, fontFamily: theme.font,
            }}
        >
            {direction === 'left' ? '‹' : '›'}
        </button>
    );
}