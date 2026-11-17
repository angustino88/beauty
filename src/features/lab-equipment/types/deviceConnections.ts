type Reference = { id: number; uid?: string; name: string };
type Choice<Value extends string> = { value: Value; label: string };

export interface DeviceConnection {
  id: number;
  computer: Reference;
  equipment: Reference | null;
  interface: Reference | null;
  interface_name: string;
  collector_key: string;
  observation_key: string;
  name: string;
  serial_number: string;
  state: Choice<'connected' | 'disconnected'>;
  match_status: Choice<'matched' | 'unmatched' | 'ambiguous' | 'interface_mismatch'>;
  freshness: Choice<'fresh' | 'stale' | 'unknown'>;
  observed_at: string;
  received_at: string;
}

export interface DeviceConnectionPage {
  data: DeviceConnection[];
  meta: {
    pagination: {
      count: number;
      page: number;
      page_size: number;
      next: string | null;
      previous: string | null;
    };
  };
}
