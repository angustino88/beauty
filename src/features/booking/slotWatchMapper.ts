/** Pure slot-watch types and response mapping (no API client import, so it is unit-testable). */
/** Where a slot alert is delivered. `in_app` is the web notification feed. */
export type SlotWatchChannel = 'email' | 'teams' | 'in_app';
export type SlotWatchStatus = 'active' | 'cancelled' | 'expired';

export const SLOT_WATCH_CHANNELS: { value: SlotWatchChannel; label: string }[] = [
  { value: 'in_app', label: 'Web' },
  { value: 'email', label: 'Email' },
  { value: 'teams', label: 'Teams' },
];

export interface ISlotWatch {
  id: number;
  benchId: number | null;
  benchName: string;
  startsAt: string;
  endsAt: string;
  channels: SlotWatchChannel[];
  status: SlotWatchStatus;
  statusLabel: string;
  createdAt: string | null;
}

export interface SlotWatchCreateRequest {
  bench_id: number;
  starts_at: string;
  ends_at: string;
  channels: SlotWatchChannel[];
}

type ChoiceRef = { value?: string; label?: string } | null | undefined;
export type RawSlotWatch = {
  id: number;
  bench?: { id?: number; name?: string; uid?: string } | null;
  starts_at: string;
  ends_at: string;
  channels?: ChoiceRef[];
  status?: ChoiceRef;
  created_at?: string | null;
};

export const mapSlotWatch = (raw: RawSlotWatch): ISlotWatch => ({
  id: raw.id,
  benchId: raw.bench?.id ?? null,
  benchName: raw.bench?.name ?? 'Bench',
  startsAt: raw.starts_at,
  endsAt: raw.ends_at,
  channels: (raw.channels ?? [])
    .map((channel) => channel?.value)
    .filter((value): value is SlotWatchChannel => value === 'email' || value === 'teams' || value === 'in_app'),
  status: (raw.status?.value as SlotWatchStatus) ?? 'active',
  statusLabel: raw.status?.label ?? 'Active',
  createdAt: raw.created_at ?? null,
});
