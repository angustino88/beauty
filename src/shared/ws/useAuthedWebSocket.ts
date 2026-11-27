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

  // Keep latest callbacks in refs so identity changes (e.g. React Router's useNavigate on
  // route transitions) never tear down and reconnect an active WebSocket.
  const callbacksRef = useRef({
    onMessage,
    onUnauthorized,
    onOpen,
    onClose,
    onError,
  });
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onUnauthorized,
      onOpen,
      onClose,
      onError,
    };
  }, [onMessage, onUnauthorized, onOpen, onClose, onError]);

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
        callbacksRef.current.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WsMessage;
          callbacksRef.current.onMessage(parsed);
        } catch {
          // Ignore malformed messages; keep socket alive.
        }
      };

      ws.onerror = (event) => {
        callbacksRef.current.onError?.(event);
      };

      ws.onclose = (event) => {
        callbacksRef.current.onClose?.(event);
        if (cancelledRef.current) return;

        const handleReconnect = async () => {
          const handleUnauthorized = callbacksRef.current.onUnauthorized;
          if (isUnauthorizedClose(event) && handleUnauthorized) {
            const recovered = await handleUnauthorized();
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
  }, [accessToken, enabled, clearReconnectTimer, urlFactory]);
}
