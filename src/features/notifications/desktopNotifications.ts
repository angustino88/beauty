/**
 * Browser (desktop) notifications: strictly opt-in, shown only while Lab Mango is in the background.
 * The browser permission prompt appears only when the user turns them on from the bell panel, or
 * sets a slot alert (a free bench is time-sensitive) without having decided yet.
 */
import { useCallback, useState } from 'react';

const PREF_KEY = 'lm:desktop-notifications';

export type DesktopPermission = 'unsupported' | 'default' | 'granted' | 'denied';

const supported = () => typeof window !== 'undefined' && 'Notification' in window;

export const desktopPermission = (): DesktopPermission => (supported() ? Notification.permission : 'unsupported');

const readPref = (): boolean => {
  try {
    return localStorage.getItem(PREF_KEY) === 'on';
  } catch {
    return false;
  }
};

const writePref = (on: boolean) => {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
  } catch {
    // Storage unavailable: the choice lasts for this page view.
  }
};

export const desktopNotificationsActive = () => desktopPermission() === 'granted' && readPref();

const hasDecided = (): boolean => {
  try {
    return localStorage.getItem(PREF_KEY) !== null;
  } catch {
    return true;
  }
};

/**
 * Called when the user asks to be alerted about a bench: turn desktop notifications on unless they
 * already chose (in the bell panel or the browser). Call it from the click, before any await, so the
 * browser treats the permission prompt as user-initiated.
 */
export function offerDesktopNotifications(): void {
  if (!supported() || hasDecided() || Notification.permission === 'denied') return;
  if (Notification.permission === 'granted') {
    writePref(true);
    return;
  }
  void Notification.requestPermission()
    .then((result) => {
      if (result !== 'default') writePref(result === 'granted');
    })
    .catch(() => undefined);
}

/** Show one OS notification; clicking it focuses Lab Mango and runs `onOpen`. Same id never shows twice. */
export function showDesktopNotification(
  item: { id: number; title: string; body: string; actionLabel?: string; urgent?: boolean },
  onOpen: () => void,
): void {
  if (!desktopNotificationsActive() || !document.hidden) return;
  // Say what a click does; keep time-sensitive alerts on screen until the user acts.
  const body = item.actionLabel ? `${item.body}\nClick to ${item.actionLabel.toLowerCase()}.` : item.body;
  try {
    const notification = new Notification(item.title, {
      body,
      tag: `labmango-${item.id}`,
      icon: '/favicon.ico',
      requireInteraction: !!item.urgent,
    });
    notification.onclick = () => {
      window.focus();
      onOpen();
      notification.close();
    };
  } catch {
    // Some browsers only allow notifications from a service worker; the in-app bell still has it.
  }
}

export function useDesktopNotifications() {
  const [permission, setPermission] = useState<DesktopPermission>(desktopPermission);
  const [enabled, setEnabled] = useState(() => permission === 'granted' && readPref());

  const enable = useCallback(async () => {
    if (!supported()) return;
    const result = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    setPermission(result);
    const on = result === 'granted';
    writePref(on);
    setEnabled(on);
  }, []);

  const disable = useCallback(() => {
    writePref(false);
    setEnabled(false);
  }, []);

  return { permission, enabled, enable, disable };
}
