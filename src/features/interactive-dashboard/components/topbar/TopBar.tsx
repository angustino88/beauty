import { useState, useEffect } from 'react';
import logoUrl from '../../../../assets/logo.png';
import { theme } from '../../theme';
import { ensureAnimations } from '../../animations';
import { StatBlock } from './StatBlock';
import { AlertBadge } from './AlertBadge';
import { ArrowBtn } from './ArrowBtn';
import type { TopBarProps } from '../../types';

function VDivider() {
    return <div style={{ width: '1px', height: '36px', background: theme.divider, margin: '0 8px', flexShrink: 0 }} />;
}

export function TopBar({
    rackCount, temperature, humidity, powerUsage,
    roomName = 'SERVER ROOM A', locationString,
    notifications, onPrev, onNext, onBack,
}: TopBarProps) {
    const [time, setTime] = useState(() => formatTime(new Date()));

    useEffect(() => {
        ensureAnimations();
        const id = setInterval(() => setTime(formatTime(new Date())), 1_000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="dcim-topbar" style={{
            position: 'relative', top: 0, left: 0, right: 0,
            height: '62px', zIndex: 25, display: 'flex', alignItems: 'center',
            background: theme.bg, borderBottom: `1.5px solid ${theme.border}`,
            padding: '0 16px', boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.06)',
            userSelect: 'none',
        }}>

            {/* LEFT: back · logo · stats */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {onBack && (
                    <button
                        title="Go back"
                        onClick={onBack}
                        style={{
                            background: 'transparent', border: `1px solid ${theme.divider}`,
                            borderRadius: '4px', color: theme.text, fontSize: '16px',
                            width: '32px', height: '32px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0, fontFamily: theme.font, marginRight: '12px', flexShrink: 0,
                        }}
                    >
                        ←
                    </button>
                )}

                {/* Logo + brand — click to go back */}
                <div
                    onClick={onBack}
                    title="Back"
                    onMouseEnter={e => { if (onBack) (e.currentTarget as HTMLDivElement).style.opacity = '0.75'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '14px', cursor: onBack ? 'pointer' : 'default' }}
                >
                    <img src={logoUrl} alt="logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontFamily: theme.font, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.accent }}>
                            Infrastructure
                        </span>
                        <span style={{ fontFamily: theme.font, fontSize: '8px', letterSpacing: '0.14em', color: theme.label }}>
                            LAB MANGO
                        </span>
                    </div>
                </div>

                <VDivider />
                <StatBlock label="Temperature" value={temperature != null ? temperature.toFixed(1) : '—'} unit={temperature != null ? '°C' : undefined} valueColor={theme.accent} valueSize="20px" />
                <VDivider />
                <StatBlock label="Humidity"    value={humidity    != null ? humidity.toFixed(0)    : '—'} unit={humidity    != null ? '%'  : undefined} valueColor={theme.humid}  valueSize="20px" />
                <VDivider />
                <StatBlock label="Power Usage" value={powerUsage  != null ? powerUsage.toFixed(1)  : '—'} unit={powerUsage  != null ? 'KW' : undefined} valueColor={theme.power}  valueSize="20px" />
                <VDivider />
                <StatBlock label="Total Stations" value={rackCount} valueSize="20px" />
            </div>

            {/* CENTER: room name + nav */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <ArrowBtn direction="left" onClick={onPrev} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontFamily: theme.font, fontSize: '16px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: theme.text, minWidth: '140px', textAlign: 'center', lineHeight: 1.1 }}>
                        {roomName}
                    </span>
                    {locationString && (
                        <span style={{ fontFamily: theme.font, fontSize: '10px', letterSpacing: '0.08em', color: theme.label, textAlign: 'center', lineHeight: 1.2 }}>
                            {locationString}
                        </span>
                    )}
                </div>
                <ArrowBtn direction="right" onClick={onNext} />
            </div>

            {/* RIGHT: alerts · live · clock */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '14px' }}>
                    <AlertBadge count={notifications.ok}       dotColor={theme.ok}   label="OK"   />
                    <AlertBadge count={notifications.warning}  dotColor={theme.warn} label="Warn" />
                    <AlertBadge count={notifications.unknown} dotColor={theme.label} label="No data" />
                    <AlertBadge count={notifications.critical} dotColor={theme.crit} label="Crit" />
                </div>
                <VDivider />
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '14px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: theme.ok, animation: 'live-fade 3s ease-in-out infinite', flexShrink: 0 }} />
                    <span style={{ fontFamily: theme.font, fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.ok }}>Snapshot</span>
                </div>
                <VDivider />
                <span style={{ fontFamily: theme.font, fontSize: '18px', fontWeight: 700, letterSpacing: '0.06em', color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
                    {time}
                </span>
            </div>
        </div>
    );
}

function formatTime(d: Date): string {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}