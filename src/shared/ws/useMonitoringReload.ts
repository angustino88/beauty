import { useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/app/store';
import { attemptRefreshAccessToken } from '@/shared/lib/api';
import { useAuthedWebSocket } from './useAuthedWebSocket';
import { getWsBaseUrl } from '@/shared/lib/backendTarget';

interface Options {
    labId?:   number | string;
    onReload: () => void;
    enabled?: boolean;
    /** Message types that trigger a reload; defaults to every monitoring reload type. */
    reloadTypes?: readonly string[];
}

const DEFAULT_RELOAD_TYPES: readonly string[] = [
    'monitoring_update',
    'STATUS_RELOAD',
    'SESSION_RELOAD',
    'MONITORING_RELOAD',
];

export function useMonitoringReload({
    labId,
    onReload,
    enabled = true,
    reloadTypes = DEFAULT_RELOAD_TYPES,
}: Options): void {
    const dispatch    = useDispatch();
    const accessToken = useAppSelector((s) => s.auth.accessToken);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reloadTypesKey = reloadTypes.join('|');
    const reloadTypeSet = useMemo(() => new Set(reloadTypesKey.split('|')), [reloadTypesKey]);


    const urlFactory = useCallback((token: string) => {
        const path = labId
            ? `ws/monitoring/${labId}/`
            : 'ws/monitoring/dashboard/';
        return `${getWsBaseUrl()}/${path}?token=${encodeURIComponent(token)}`;
    }, [labId]);

    const handleMessage = useCallback((msg: { type?: string }) => {
        if (!reloadTypeSet.has(msg.type ?? '')) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onReload();
            debounceRef.current = null;
        }, 500);
    }, [onReload, reloadTypeSet]);

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