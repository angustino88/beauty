import { Tag, Tooltip } from 'antd';

interface TagCellProps {
  item: object;
  displayKey: string;
  tooltipKey?: string;
}

export function TagCell({ item, displayKey, tooltipKey }: TagCellProps) {
  if (!item) return null;
  const data = item as Record<string, unknown>;
  const displayValue = String(data[displayKey] ?? '').trim();
  if (!displayValue) return null;

  return (
    <Tooltip
      placement="right"
      title={tooltipKey ? String(data[tooltipKey] ?? '') : null}
    >
      <Tag
        style={{
          color: '#4338CA',
          background: '#EEF2FF',
          border: 'none',
          borderRadius: 14,
          fontWeight: 500,
        }}
      >
        👤 {displayValue}
      </Tag>
    </Tooltip>
  );
}
