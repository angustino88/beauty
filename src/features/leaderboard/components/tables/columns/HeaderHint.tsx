import { Tooltip } from 'antd';

/** Column title with its KPI definition on hover, so short labels stay unambiguous. */
export function HeaderHint({ label, hint }: { label: string; hint: string }) {
  return (
    <Tooltip title={hint}>
      <span style={{ cursor: 'help', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{label}</span>
    </Tooltip>
  );
}
