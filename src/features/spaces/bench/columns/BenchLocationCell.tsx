import { SpaceLocationEmpty, SpaceLocationRow, SpaceLocationStack } from "@/features/spaces/shared/components/SpaceLocation";
import type { IBench } from "../types";
import { benchLocationView } from "./benchLocation";

/** Station on the first line, its room underneath; hover either name to see where it is. */
export function BenchLocationCell({ bench }: { bench: IBench }) {
  const { station } = bench;
  const { roomLabel } = benchLocationView(bench);

  if (!station && !roomLabel) return <SpaceLocationEmpty label="Unplaced" />;

  return (
    <SpaceLocationStack>
        <SpaceLocationRow
          kind="station"
          primary
          label={station ? station.name || station.sku : null}
          searchKey={station?.sku}
          refId={station?.id}
          slot={bench.station_slot_name}
        />
        <SpaceLocationRow
          kind="room"
          label={bench.room ? roomLabel : null}
          searchKey={bench.room?.sku}
          refId={bench.room?.id}
        />
    </SpaceLocationStack>
  );
}
