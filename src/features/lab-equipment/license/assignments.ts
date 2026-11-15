/** Which equipment to release and which to assign so a license ends up on `desired`. */
export function diffAssignments(
  current: readonly number[],
  desired: readonly number[],
): { release: number[]; assign: number[] } {
  const have = new Set(current);
  const want = new Set(desired);
  return {
    release: [...have].filter((id) => !want.has(id)),
    assign: [...want].filter((id) => !have.has(id)),
  };
}
