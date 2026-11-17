import { DesktopOutlined } from '@ant-design/icons';
import type { ResourceSelectOption } from '@/components/inputs/ResourceOption';
import type { IBookingBenchChoice } from '../types';

const computerLabel = (computer: IBookingBenchChoice['computers'][number]) => computer.name || computer.sku;

/** `<Bench SKU> (<Computing Name>)`: the one way a bench is written in booking screens. */
export function formatBenchLabel(sku?: string | null, name?: string | null, computerNames: Array<string | null | undefined> = []): string {
  const bench = sku || name || '';
  const computers = computerNames.filter(Boolean).join(', ');
  return computers ? `${bench} (${computers})` : bench;
}

/** A bench can be booked only when a computing resource is mapped to it. */
export const isBookableBench = (bench: IBookingBenchChoice): boolean =>
  bench.computers.some((computer) => computer.name || computer.sku);

/**
 * Benches offered for a new booking: only those with a computing resource mapped. `keepId` is the bench of a booking
 * being edited, which stays selectable so the form can still show it.
 */
export const selectBookableBenches = (benches: IBookingBenchChoice[] | undefined, keepId?: number | null): IBookingBenchChoice[] =>
  (benches ?? []).filter((bench) => isBookableBench(bench) || (keepId != null && bench.id === keepId));

/**
 * A bench option for booking, always `<Bench SKU> (<Computing Name>)`. Search matches SKU, name and the computers'
 * names, SKUs and hostnames. No hover tooltip: the text is already the whole label.
 */
export function toBenchChoiceOption(bench: IBookingBenchChoice): ResourceSelectOption {
  const computers = bench.computers.filter((computer) => computer.name || computer.sku);
  const computerNames = computers.map(computerLabel);
  const benchText = bench.sku || bench.name || '';
  const text = formatBenchLabel(bench.sku, bench.name, computerNames);
  return {
    value: bench.id,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{benchText}</span>
        {computerNames.length > 0 && (
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0, color: 'var(--lm-text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            <DesktopOutlined />({computerNames.join(', ')})
          </span>
        )}
      </span>
    ),
    title: '',
    selectedLabel: text,
    searchText: [bench.sku, bench.name, ...computers.flatMap((c) => [c.name, c.sku, c.hostname])]
      .filter(Boolean).join(' ').toLowerCase(),
  };
}
