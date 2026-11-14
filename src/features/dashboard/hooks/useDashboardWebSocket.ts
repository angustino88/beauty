import { useDashboardRealtime } from './useDashboardRealtime';

interface UseDashboardWebSocketParams {
  isAnyFilterOpen: () => boolean;
}

export function useDashboardWebSocket({ isAnyFilterOpen }: UseDashboardWebSocketParams): void {
  useDashboardRealtime({ isAnyFilterOpen });
}
