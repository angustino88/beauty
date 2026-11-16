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

/**
 * A bench option for booking. `show: 'bench'` (calendar filter) reads `<Bench SKU> (<Computing Name>)`;
 * `show: 'computer'` (create / edit booking) reads the computing name, because people book the machine they
 * remote into. A bench with no computer falls back to its SKU. Search matches SKU, name and the computers'
 * names, SKUs and hostnames. No hover tooltip: the text is already the whole label.
 */
export function toBenchChoiceOption(
  bench: IBookingBenchChoice,
  { show = 'bench' }: { show?: 'bench' | 'computer' } = {},
): ResourceSelectOption {
  const computers = bench.computers.filter((computer) => computer.name || computer.sku);
  const computerNames = computers.map(computerLabel);
  const text = show === 'computer' && computerNames.length
    ? computerNames.join(', ')
    : formatBenchLabel(bench.sku, bench.name, computerNames);
  return {
    value: bench.id,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {show === 'computer' && computerNames.length > 0 && <DesktopOutlined />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
      </span>
    ),
    title: '',
    selectedLabel: text,
    searchText: [bench.sku, bench.name, ...computers.flatMap((c) => [c.name, c.sku, c.hostname])]
      .filter(Boolean).join(' ').toLowerCase(),
  };
}
