import type { TicketDetailRead } from '../../shared/api/generated/api.ts';

export type TicketWrite = (current: TicketDetailRead, version: number) => Promise<TicketDetailRead>;
export type RunTicketWrite = (field: string, write: TicketWrite) => Promise<void>;

export class SkippedTicketWrite extends Error {
  constructor() {
    super('A previous change failed. Try this change again.');
  }
}

export function isTicketVersionConflict(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 409;
}

/** Serialize writes from a single ticket view using the preceding response's version. */
export function createTicketWriteQueue<T extends { version?: number }>() {
  let tail: Promise<T> | undefined;
  let saved: T | undefined;

  return (snapshot: T, write: (current: T, version: number) => Promise<T>): Promise<T> => {
    const initial = saved && (saved.version ?? -1) > (snapshot.version ?? -1) ? saved : snapshot;
    const previous = tail
      ? tail.catch(() => { throw new SkippedTicketWrite(); })
      : Promise.resolve(initial);

    const pending = previous.then(async (current) => {
      if (current.version === undefined) throw new Error('Refresh the ticket before saving.');
      saved = await write(current, current.version);
      return saved;
    });
    tail = pending;

    const release = () => {
      if (tail === pending) tail = undefined;
    };
    void pending.then(release, release);
    return pending;
  };
}
