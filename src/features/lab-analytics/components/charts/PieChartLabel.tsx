interface PieChartLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  payload?: {
    entries?: number | string;
  };
}

export function PieChartLabel(props: PieChartLabelProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, payload } = props;
  if (
    cx == null
    || cy == null
    || midAngle == null
    || innerRadius == null
    || outerRadius == null
    || percent == null
    || percent < 0.04
  ) {
    return null;
  }

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontWeight={800}>
      {payload?.entries ?? ''}
    </text>
  );
}

