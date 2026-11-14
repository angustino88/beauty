export type WsMessage = { type?: string; [key: string]: unknown };

export interface UseAuthedWebSocketOptions {
  enabled: boolean;
  urlFactory: (accessToken: string) => string;
  onMessage: (message: WsMessage) => void;
  onUnauthorized?: () => Promise<boolean>;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}
