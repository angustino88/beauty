import {
  mapChoice,
  type Choice,
  type Downtime,
  type DowntimeKind,
  type DowntimeReason,
  type DowntimeState,
  type ResourceType,
} from './resourceStatus.ts';

export interface DowntimeListResponse {
  data: Downtime[];
  total: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function mapDowntimeItem(raw: unknown): Downtime {
  const d = isRecord(raw) ? raw : {};
  const res = isRecord(d.resource) ? d.resource : {};
  const actor = isRecord(d.actor) ? d.actor : null;
  const endedBy = isRecord(d.ended_by) ? d.ended_by : null;

  return {
    id: Number(d.id) || 0,
    resource: {
      type: (res.type as ResourceType) || 'bench',
      id: Number(res.id) || 0,
    },
    condition: mapChoice(d.condition, 'in_maintenance', 'In maintenance') as Choice<
      'in_maintenance' | 'out_of_service'
    >,
    kind: mapChoice(d.kind, 'planned', 'Planned') as Choice<DowntimeKind>,
    reason: mapChoice(d.reason, 'other', 'Other') as Choice<DowntimeReason>,
    state: mapChoice(d.state, 'scheduled', 'Scheduled').value as DowntimeState,
    starts_at: String(d.starts_at || ''),
    ends_at: typeof d.ends_at === 'string' && d.ends_at.trim() ? d.ends_at : null,
    cancelled_at: typeof d.cancelled_at === 'string' && d.cancelled_at.trim() ? d.cancelled_at : null,
    notes: String(d.notes || ''),
    actor: actor
      ? {
          id: Number(actor.id) || 0,
          username: String(actor.name || ''),
          display_name: String(actor.name || ''),
        }
      : null,
    ended_by: endedBy
      ? {
          id: Number(endedBy.id) || 0,
          username: String(endedBy.name || ''),
          display_name: String(endedBy.name || ''),
        }
      : null,
    created_at: String(d.created_at || ''),
    updated_at: String(d.updated_at || ''),
  };
}

export function mapDowntimeListResponse(response: unknown): DowntimeListResponse {
  const envelope = isRecord(response) ? response : {};
  const data = envelope.data ?? envelope;

  if (Array.isArray(data)) {
    return {
      data: data.map(mapDowntimeItem),
      total: data.length,
    };
  }

  const dataRec = isRecord(data) ? data : {};
  const results = Array.isArray(dataRec.results) ? dataRec.results : [];
  const meta = isRecord(envelope.meta) ? envelope.meta : {};
  const pagination = isRecord(meta.pagination) ? meta.pagination : {};

  return {
    data: results.map(mapDowntimeItem),
    total: Number(pagination.count) || Number(dataRec.total_count) || results.length,
  };
}
