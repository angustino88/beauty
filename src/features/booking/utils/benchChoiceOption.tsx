import { DesktopOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import { toResourceOption, type ResourceSelectOption } from '@/components/inputs/ResourceOption';
import type { IBookingBenchChoice } from '../types';

const MAX_COMPUTER_TAGS = 2;

const computerText = (computer: IBookingBenchChoice['computers'][number]) =>
  computer.hostname && computer.hostname !== computer.name ? `${computer.name} (${computer.hostname})` : computer.name;

/**
 * A bench option for booking: the bench SKU with the computers on it beside it (people book by the computer they
 * remote into, not by the SKU), the bench name below. Search matches SKU, name, computer names, SKUs and hostnames.
 * The closed select shows "SKU · first computer" (`optionLabelProp="selectedLabel"`).
 */
export function toBenchChoiceOption(bench: IBookingBenchChoice): ResourceSelectOption {
  const computers = bench.computers.filter((computer) => computer.name || computer.sku);
  const shown = computers.slice(0, MAX_COMPUTER_TAGS);
  const more = computers.length - shown.length;
  const aside = computers.length ? (
    <span style={{ display: 'inline-flex', gap: 4, minWidth: 0, overflow: 'hidden' }}>
      {shown.map((computer) => (
        <Tag key={computer.id} icon={<DesktopOutlined />} color="blue" style={{ marginInlineEnd: 0 }}>
          {computer.name || computer.sku}
        </Tag>
      ))}
      {more > 0 && <Tag style={{ marginInlineEnd: 0 }}>+{more}</Tag>}
    </span>
  ) : null;
  const computerNames = computers.map((computer) => computer.name || computer.sku);
  return toResourceOption(
    {
      id: bench.id,
      sku: bench.sku,
      name: bench.name,
      keywords: computers.flatMap((computer) => [computer.name, computer.sku, computer.hostname]),
    },
    {
      aside,
      detail: computers.length ? undefined : 'No computer on this bench',
      selectedLabel: [bench.sku || bench.name, computerNames[0]].filter(Boolean).join(' · '),
      title: [
        `${bench.name || bench.sku}${bench.sku && bench.name ? ` (${bench.sku})` : ''}`,
        computers.length ? `Computers: ${computers.map(computerText).join(', ')}` : 'No computer on this bench',
      ].join(' · '),
    },
  );
}
