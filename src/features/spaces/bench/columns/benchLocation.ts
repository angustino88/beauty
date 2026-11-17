/** What the "Station & Room" cell shows for one bench. */
export interface BenchLocationView {
  /** The room the bench's station is in; null when the bench is unplaced or the station has no room. */
  roomLabel: string | null;
  /** Full parent-first path, for the tooltip. */
  path: string | null;
}

interface BenchLocationInput {
  room?: { sku: string; name: string } | null;
  location_path?: string | null;
}

/** The bench API sends the station's room as `room`; the location path is only shown as a hint. */
export function benchLocationView(bench: BenchLocationInput): BenchLocationView {
  const path = bench.location_path?.trim() || null;
  const roomLabel = bench.room ? bench.room.name || bench.room.sku || null : null;
  return { roomLabel, path };
}
