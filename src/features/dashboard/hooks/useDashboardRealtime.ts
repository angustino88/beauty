import { useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { attemptRefreshAccessToken } from '@/shared/lib/api';
import { useAuthedWebSocket } from '@/shared/ws/useAuthedWebSocket';
import { dashboardApi } from '../api';

interface UseDashboardRealtimeParams {
  isAnyFilterOpen: () => boolean;
}

export function useDashboardRealtime({ isAnyFilterOpen }: UseDashboardRealtimeParams): void {
  const dispatch = useDispatch();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalidate = useCallback(() => {
    dispatch(dashboardApi.util.invalidateTags(['LabDevice', 'DashboardStats']));
  }, [dispatch]);

  const wsBase = useMemo(
    () => ((import.meta.env.VITE_API_URL as string) || '').replace(/^http/, 'ws'),
    [],
  );

  const urlFactory = useCallback(
    (token: string) => `${wsBase}/ws/monitoring/dashboard/?token=${encodeURIComponent(token)}`,
    [wsBase],
  );

  const handleMessage = useCallback((msg: { type?: string }) => {
    if (msg.type !== 'monitoring_update') return;
    if (isAnyFilterOpen()) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      invalidate();
      debounceTimer.current = null;
    }, 500);
  }, [invalidate, isAnyFilterOpen]);

  const handleUnauthorized = useCallback(
    async () => {
      const token = await attemptRefreshAccessToken(dispatch as (action: { type: string; payload?: string }) => void);
      return Boolean(token);
    },
    [dispatch],
  );

  useAuthedWebSocket({
    enabled: true,
    urlFactory,
    onMessage: handleMessage,
    onUnauthorized: handleUnauthorized,
  });
}