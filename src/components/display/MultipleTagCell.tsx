import { Tag, Tooltip } from 'antd';

interface MultipleTagCellProps {
  val: Record<string, unknown>[];
  displayKey: string;
  tooltipKey?: string;
}

export function MultipleTagCell({ val, displayKey, tooltipKey }: MultipleTagCellProps) {
  if (!Array.isArray(val) || val.length === 0) return null;

  return (
    <>
      {val.map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const displayValue = String(item[displayKey] ?? '').trim();
        if (!displayValue) return null;

        return (
          <Tooltip
            key={(item.id as string | number | undefined) ?? index}
            placement="right"
            title={tooltipKey ? String(item[tooltipKey] ?? '') : null}
          >
            <Tag>{displayValue}</Tag>
          </Tooltip>
        );
      })}
    </>
  );
}
