export const TAB_ID = crypto.randomUUID();

const SESSION_KEY = 'labmango_chat_session';

export const setChatSessionId = (sessionId: string): void => {
  sessionStorage.setItem(SESSION_KEY, sessionId);
};

export const clearAllChatStorage = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};

