/** What the "Station & Room" cell shows for one bench. */
export interface BenchLocationView {
  /** The room (or wider location) the bench's station is in; null when the station has no room. */
  roomLabel: string | null;
  /** Full parent-first path, for the tooltip. */
  path: string | null;
}

interface BenchLocationInput {
  station?: { sku: string; name: string } | null;
  room?: { sku: string; name: string } | null;
  location_path?: string | null;
}

// The API joins path segments with "-" (room segment, then the station's label, SKU or name).
const SEPARATOR = '-';

/**
 * The room part of a bench's location. The bench API sends no room, only `setup_location_path`, which ends
 * with the station's own segment; for a station that is not in a room the path is that segment alone.
 */
export function benchLocationView(bench: BenchLocationInput): BenchLocationView {
  const path = bench.location_path?.trim() || null;
  if (bench.room) return { roomLabel: bench.room.name || bench.room.sku, path };
  if (!path) return { roomLabel: null, path };

  const stationSegments = [bench.station?.sku, bench.station?.name].filter((s): s is string => Boolean(s));
  if (stationSegments.includes(path)) return { roomLabel: null, path };
  for (const segment of stationSegments) {
    const suffix = `${SEPARATOR}${segment}`;
    if (path.endsWith(suffix)) return { roomLabel: path.slice(0, -suffix.length) || null, path };
  }
  // The station's segment is a label we do not know: show the whole path rather than guess.
  return { roomLabel: path, path };
}
