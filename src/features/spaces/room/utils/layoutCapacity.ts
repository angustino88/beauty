export const computeCapacityFromGrid = (rows: unknown, cols: unknown): number | null => {
  const rowValue = Number(rows);
  const colValue = Number(cols);
  if (!Number.isFinite(rowValue) || !Number.isFinite(colValue)) return null;
  if (rowValue <= 0 || colValue <= 0) return null;
  return rowValue * colValue;
};