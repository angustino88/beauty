export type MessageType =
  | 'auth'
  | 'auth_success'
  | 'auth_error'
  | 'bot_message'
  | 'bot_state'
  | 'user_message'
  | 'ping'
  | 'pong'
  | 'error'
  | 'session_cleared';

export interface AuthRequest {
  type: 'auth';
  token: string;
  tab_id: string;
  utc_offset_minutes: number;
}

export interface AuthSuccess {
  type: 'auth_success';
  session_id: string;
}

export interface AuthError {
  type: 'auth_error';
  message: string;
  error_code?: string;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
  error_code?: string;
}

export interface SessionClearedMessage {
  type: 'session_cleared';
}

export interface BotMessage {
  type: 'bot_message';
  text: string;
  is_complete?: boolean;
  choices?: string[];
}

export interface BotStateMessage {
  type: 'bot_state';
  status: string;
  node?: string;
}

export interface UserMessage {
  type: 'user_message';
  text: string;
}

export interface PingMessage {
  type: 'ping';
}

export interface PongMessage {
  type: 'pong';
  timestamp?: string;
}

export type IncomingMessage =
  | AuthSuccess
  | AuthError
  | BotMessage
  | BotStateMessage
  | PingMessage
  | PongMessage
  | ErrorMessage
  | SessionClearedMessage;

export type OutgoingMessage = AuthRequest | UserMessage | PingMessage | PongMessage;

export interface ChatMessageUI {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isComplete?: boolean;
  choices?: string[];
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

