import { Tooltip } from "antd";
import { SpaceLocationEmpty, SpaceLocationRow, SpaceLocationStack } from "@/features/spaces/shared/components/SpaceLocation";
import type { IBench } from "../types";
import { benchLocationView } from "./benchLocation";

/** Station on the first line, its room underneath; one of each, never the station twice. */
export function BenchLocationCell({ bench }: { bench: IBench }) {
  const { station } = bench;
  const { roomLabel, path } = benchLocationView(bench);

  if (!station && !roomLabel) return <SpaceLocationEmpty label="Unplaced" />;

  return (
    <Tooltip title={path ? `Location: ${path}` : undefined} placement="topLeft">
      <SpaceLocationStack>
        <SpaceLocationRow
          kind="station"
          primary
          label={station ? station.name || station.sku : null}
          searchKey={station?.sku}
          slot={bench.station_slot_name}
        />
        <SpaceLocationRow
          kind="room"
          label={bench.room ? roomLabel : null}
          searchKey={bench.room?.sku}
        />
      </SpaceLocationStack>
    </Tooltip>
  );
}
