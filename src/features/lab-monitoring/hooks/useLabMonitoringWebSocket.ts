import { useMonitoringReload } from '@/shared/ws/useMonitoringReload';

interface UseLabMonitoringWebSocketParams {
    labId?:   number;
    onReload: () => void;
}

export function useLabMonitoringWebSocket({ labId, onReload }: UseLabMonitoringWebSocketParams): void {
    useMonitoringReload({ labId, onReload });
}