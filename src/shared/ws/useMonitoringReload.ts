import { useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/app/store';
import { attemptRefreshAccessToken } from '@/shared/lib/api';
import { useAuthedWebSocket } from './useAuthedWebSocket';

interface Options {
    labId?:   number | string;
    onReload: () => void;
    enabled?: boolean;
}

const RELOAD_TYPES = new Set([
    'monitoring_update',
    'STATUS_RELOAD',
    'SESSION_RELOAD',
    'MONITORING_RELOAD',
]);

export function useMonitoringReload({ labId, onReload, enabled = true }: Options): void {
    const dispatch    = useDispatch();
    const accessToken = useAppSelector((s) => s.auth.accessToken);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const wsBase = useMemo(
        () => (import.meta.env.VITE_API_URL as string).replace(/^http/, 'ws'),
        [],
    );

    const urlFactory = useCallback((token: string) => {
        const path = labId
            ? `ws/monitoring/${labId}/`
            : 'ws/monitoring/dashboard/';
        return `${wsBase}/${path}?token=${encodeURIComponent(token)}`;
    }, [wsBase, labId]);

    const handleMessage = useCallback((msg: { type?: string }) => {
        if (!RELOAD_TYPES.has(msg.type ?? '')) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onReload();
            debounceRef.current = null;
        }, 500);
    }, [onReload]);

    const handleUnauthorized = useCallback(async () => {
        const token = await attemptRefreshAccessToken(
            dispatch as (a: { type: string; payload?: string }) => void,
        );
        return Boolean(token);
    }, [dispatch]);

    useAuthedWebSocket({
        enabled:        Boolean(accessToken) && enabled,
        urlFactory,
        onMessage:      handleMessage,
        onUnauthorized: handleUnauthorized,
    });
}