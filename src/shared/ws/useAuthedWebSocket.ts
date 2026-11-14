import { useCallback, useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/store';
import type { UseAuthedWebSocketOptions, WsMessage } from './types';

const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 15000;

const isUnauthorizedClose = (event: CloseEvent) =>
  event.code === 4001
  || event.code === 4401
  || /auth|token|unauthorized/i.test(event.reason);

export function useAuthedWebSocket({
  enabled,
  urlFactory,
  onMessage,
  onUnauthorized,
  onOpen,
  onClose,
  onError,
}: UseAuthedWebSocketOptions): void {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const cancelledRef = useRef(false);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    clearReconnectTimer();

    if (!enabled || !accessToken) {
      wsRef.current?.close();
      wsRef.current = null;
      return () => undefined;
    }

    const scheduleReconnect = (connect: () => void) => {
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(BASE_RECONNECT_DELAY_MS * (2 ** attempt), MAX_RECONNECT_DELAY_MS);
      reconnectTimerRef.current = setTimeout(connect, delay);
      reconnectAttemptRef.current += 1;
    };

    const connect = () => {
      if (cancelledRef.current || !accessToken) return;

      const ws = new WebSocket(urlFactory(accessToken));
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WsMessage;
          onMessage(parsed);
        } catch {
          // Ignore malformed messages; keep socket alive.
        }
      };

      ws.onerror = (event) => {
        onError?.(event);
      };

      ws.onclose = (event) => {
        onClose?.(event);
        if (cancelledRef.current) return;

        const handleReconnect = async () => {
          if (isUnauthorizedClose(event) && onUnauthorized) {
            const recovered = await onUnauthorized();
            if (recovered) {
              reconnectAttemptRef.current = 0;
              return;
            }
            return;
          }
          scheduleReconnect(connect);
        };

        void handleReconnect();
      };
    };

    connect();

    return () => {
      cancelledRef.current = true;
      clearReconnectTimer();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [accessToken, enabled, clearReconnectTimer, onClose, onError, onMessage, onOpen, onUnauthorized, urlFactory]);
}
