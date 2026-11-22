import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/app/store";
import type {
  ChatMessageUI,
  ConnectionStatus,
  IncomingMessage,
  OutgoingMessage,
} from "../types/chat";
import {
  TAB_ID,
  setChatSessionId,
  clearAllChatStorage,
} from "../utils/chatStorage";

const WS_URL = `${String(import.meta.env.VITE_WS_URL_CHATBOT)}/booking`;
const PING_INTERVAL = 30_000;

interface Options {
  /** Called when the /exit flow completes so the UI can close the panel. */
  onExit?: () => void;
}

const createMessageId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const useChatWebSocket = ({ onExit }: Options = {}) => {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<string[] | null>(null);
  const [agentStatus, setAgentStatus] = useState<{
    status: string;
    node?: string;
  } | null>(null);

  // Derived: lock input whenever the socket is not fully connected, or the bot
  // is waiting for the user to pick one of the presented choices.
  const inputLocked = status !== "connected" || (choices?.length ?? 0) > 0;

  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Set before sending /exit so `onclose` knows to wipe instead of reconnect. */
  const exitPendingRef = useRef(false);

  // Keep refs in sync so WebSocket callbacks never capture stale values.
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const accessTokenRef = useRef(accessToken);
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);

  const onExitRef = useRef(onExit);
  useEffect(() => { onExitRef.current = onExit; }, [onExit]);

  const send = useCallback((msg: OutgoingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const stopPing = useCallback(() => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
  }, []);

  /** Null all handlers, close the socket, and stop the ping timer. */
  const teardown = useCallback(() => {
    stopPing();
    const sock = wsRef.current;
    if (sock) {
      sock.onopen = null;
      sock.onmessage = null;
      sock.onclose = null;
      sock.onerror = null;
      sock.close();
      wsRef.current = null;
    }
  }, [stopPing]);

  /** Wipe all session data + reset every piece of UI state. */
  const wipeSession = useCallback(() => {
    const wasExit = exitPendingRef.current;
    clearAllChatStorage();
    setMessages([]);
    setChoices(null);
    setAgentStatus(null);
    setError(null);
    setStatus("disconnected");
    exitPendingRef.current = false;
    if (wasExit) onExitRef.current?.();
  }, []); // stable — reads refs only, not props

  // Connect (imperative — called from component click handlers)
  const connect = useCallback(() => {
    // Already open or mid-handshake → nothing to do
    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    // Tear down any zombie socket from a previous attempt
    teardown();

    setStatus("connecting");
    setError(null);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      send({
        type: "auth",
        token: accessTokenRef.current ?? "",
        tab_id: TAB_ID,
        utc_offset_minutes: -new Date().getTimezoneOffset(),
      });
      pingRef.current = setInterval(() => send({ type: "ping" }), PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const data: IncomingMessage = JSON.parse(event.data);

        switch (data.type) {
          case "auth_success":
            setChatSessionId(data.session_id);
            setStatus("connected");
            break;

          case "auth_error":
            setStatus("error");
            setError(data.message);
            break;

          case "bot_state":
            setAgentStatus({ status: data.status, node: data.node });
            break;

          case "bot_message": {
            setAgentStatus(null);
            setMessages((prev) => {
              // Dedup guard: on reconnect the server may replay the last message.
              // If the incoming text is identical to the last bot message, skip it.
              const last = prev[prev.length - 1];
              if (last && last.sender === "bot" && last.text === data.text) {
                return prev;
              }
              return [
                ...prev,
                {
                  id: createMessageId(),
                  sender: "bot",
                  text: data.text,
                  timestamp: new Date(),
                  isComplete: data.is_complete,
                  choices: data.choices,
                },
              ];
            });

            setChoices(data.choices?.length ? data.choices : null);
            break;
          }

          case "ping":
            send({ type: "pong" });
            break;

          case "pong":
            break;

          case "session_cleared":
            wipeSession();
            break;

          case "error":
            setAgentStatus(null);
            setStatus("error");
            setError(data.message || "The assistant could not complete that request. Please try again.");
            break;
        }
      } catch (err) {
        console.error("Chat: failed to parse WS message", err);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      stopPing();
      setAgentStatus(null);

      if (exitPendingRef.current) {
        wipeSession();
      } else {
        setStatus("disconnected");
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setError("Unable to connect to the assistant. Check your connection and try again.");
    };
  }, [send, teardown, stopPing, wipeSession]);

  // Disconnect (imperative — called from component click handlers)
  const disconnect = useCallback(() => teardown(), [teardown]);

  // Send a user (or slash-command) message
  const sendText = useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        { id: createMessageId(), sender: "user", text, timestamp: new Date() },
      ]);
      setChoices(null);

      if (text.trim().toLowerCase() === "/exit") {
        exitPendingRef.current = true;
      }

      send({ type: "user_message", text });
    },
    [send],
  );

  // Cleanup on true unmount
  useEffect(() => () => teardown(), [teardown]);

  return {
    messages,
    status,
    error,
    choices,
    inputLocked,
    agentStatus,
    connect,
    disconnect,
    sendText,
  };
};

