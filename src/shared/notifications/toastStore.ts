import type { ToastInput, ToastOptions, ToastRecord, ToastVariant } from './types.ts';

export const DEFAULT_TOAST_DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  info: 5000,
  warning: 6500,
  // Errors remain visible until dismissed so users never miss actionable failure context.
  error: 0,
  loading: 0,
};

export const MAX_VISIBLE_TOASTS = 4;

type Listener = () => void;

let nextId = 1;
let toasts: ToastRecord[] = [];
const listeners = new Set<Listener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function clearTimer(id: string): void {
  const handle = timers.get(id);
  if (handle !== undefined) {
    clearTimeout(handle);
    timers.delete(id);
  }
}

function scheduleDismiss(id: string, delayMs: number): void {
  clearTimer(id);
  if (delayMs <= 0) return;
  const handle = setTimeout(() => {
    timers.delete(id);
    dismissToast(id);
  }, delayMs);
  timers.set(id, handle);
}

function computeDedupeKey(input: ToastInput): string {
  if (input.key) return input.key;
  const normalizedTitle = input.title.trim().toLowerCase();
  const normalizedDesc = (input.description ?? '').trim().toLowerCase();
  const normalizedCode = (input.code ?? '').trim().toLowerCase();
  return `${input.variant}::${normalizedCode}::${normalizedTitle}::${normalizedDesc}`;
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastsSnapshot(): readonly ToastRecord[] {
  return toasts;
}

export function pushToast(input: ToastInput): string {
  const now = Date.now();
  const key = computeDedupeKey(input);
  const duration =
    input.duration !== undefined ? input.duration : DEFAULT_TOAST_DURATIONS[input.variant];
  const dismissible = input.dismissible ?? input.variant !== 'loading';

  const existingIndex = toasts.findIndex((item) => item.key === key);
  if (existingIndex !== -1) {
    const existing = toasts[existingIndex];
    const updated: ToastRecord = {
      ...existing,
      variant: input.variant,
      title: input.title,
      description: input.description,
      code: input.code,
      details: input.details,
      duration,
      dismissible,
      action: input.action,
      updatedAt: now,
      count: existing.count + 1,
      remainingMs: duration,
      paused: existing.paused,
    };
    toasts = [
      updated,
      ...toasts.filter((_, index) => index !== existingIndex),
    ];
    if (!updated.paused) {
      scheduleDismiss(updated.id, duration);
    }
    emit();
    return updated.id;
  }

  const id = `lm-toast-${nextId++}`;
  const record: ToastRecord = {
    id,
    key,
    variant: input.variant,
    title: input.title,
    description: input.description,
    code: input.code,
    details: input.details,
    duration,
    dismissible,
    action: input.action,
    createdAt: now,
    updatedAt: now,
    count: 1,
    paused: false,
    remainingMs: duration,
  };

  const nextList = [record, ...toasts];

  // Enforce stack cap: evict oldest auto-dismissible toast first, then oldest overall.
  while (nextList.length > MAX_VISIBLE_TOASTS) {
    let evictIndex = -1;
    for (let i = nextList.length - 1; i >= 0; i -= 1) {
      if (nextList[i].duration > 0) {
        evictIndex = i;
        break;
      }
    }
    if (evictIndex === -1) {
      evictIndex = nextList.length - 1;
    }
    const [evicted] = nextList.splice(evictIndex, 1);
    clearTimer(evicted.id);
  }

  toasts = nextList;
  scheduleDismiss(id, duration);
  emit();
  return id;
}

export function updateToast(
  id: string,
  patch: Partial<Omit<ToastInput, 'key'>>,
): void {
  const index = toasts.findIndex((item) => item.id === id);
  if (index === -1) return;

  const existing = toasts[index];
  const nextVariant = patch.variant ?? existing.variant;
  const nextDuration =
    patch.duration !== undefined
      ? patch.duration
      : patch.variant !== undefined
        ? DEFAULT_TOAST_DURATIONS[nextVariant]
        : existing.duration;
  const nextDismissible =
    patch.dismissible !== undefined
      ? patch.dismissible
      : patch.variant !== undefined
        ? nextVariant !== 'loading'
        : existing.dismissible;

  const updated: ToastRecord = {
    ...existing,
    variant: nextVariant,
    title: patch.title ?? existing.title,
    description: patch.description !== undefined ? patch.description : existing.description,
    code: patch.code !== undefined ? patch.code : existing.code,
    details: patch.details !== undefined ? patch.details : existing.details,
    action: patch.action !== undefined ? patch.action : existing.action,
    duration: nextDuration,
    dismissible: nextDismissible,
    updatedAt: Date.now(),
    remainingMs: nextDuration,
  };

  toasts = toasts.map((item) => (item.id === id ? updated : item));
  if (!updated.paused) {
    scheduleDismiss(id, nextDuration);
  }
  emit();
}

export function pauseToast(id: string): void {
  const existing = toasts.find((item) => item.id === id);
  if (!existing || existing.paused || existing.duration <= 0) return;

  clearTimer(id);
  const elapsed = Date.now() - existing.updatedAt;
  const remainingMs = Math.max(400, existing.remainingMs - elapsed);

  toasts = toasts.map((item) =>
    item.id === id ? { ...item, paused: true, remainingMs } : item,
  );
  emit();
}

export function resumeToast(id: string): void {
  const existing = toasts.find((item) => item.id === id);
  if (!existing || !existing.paused) return;

  const now = Date.now();
  toasts = toasts.map((item) =>
    item.id === id ? { ...item, paused: false, updatedAt: now } : item,
  );
  if (existing.duration > 0) {
    scheduleDismiss(id, existing.remainingMs);
  }
  emit();
}

export function dismissToast(id?: string): void {
  if (!id) {
    for (const item of toasts) {
      clearTimer(item.id);
    }
    if (toasts.length === 0) return;
    toasts = [];
    emit();
    return;
  }

  clearTimer(id);
  const nextList = toasts.filter((item) => item.id !== id);
  if (nextList.length === toasts.length) return;
  toasts = nextList;
  emit();
}

export const notify = {
  success: (title: string, options?: ToastOptions): string =>
    pushToast({ variant: 'success', title, ...options }),
  info: (title: string, options?: ToastOptions): string =>
    pushToast({ variant: 'info', title, ...options }),
  warning: (title: string, options?: ToastOptions): string =>
    pushToast({ variant: 'warning', title, ...options }),
  error: (title: string, options?: ToastOptions): string =>
    pushToast({ variant: 'error', title, ...options }),
  loading: (title: string, options?: ToastOptions): string =>
    pushToast({ variant: 'loading', title, ...options }),
  update: updateToast,
  dismiss: dismissToast,
  clear: (): void => dismissToast(),
};
