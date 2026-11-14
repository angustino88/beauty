let _injected = false;

/** Injects CSS keyframes used by RackStatus and TopBar. Safe to call multiple times. */
export function ensureAnimations(): void {
    if (_injected || typeof document === 'undefined') return;
    _injected = true;
    const style = document.createElement('style');
    style.textContent = [
        '@keyframes crit-pulse { 0%,100% { opacity:1 } 50% { opacity:0.55 } }',
        '@keyframes live-fade  { 0%,100% { opacity:1 } 50% { opacity:0.35 } }',
    ].join('\n');
    document.head.appendChild(style);
}