import { Spin } from "antd";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useLabsBenchesRetrieveByBenchIdQuery,
  useLabsRoomsRetrieveByRoomIdQuery,
  useLabsStationsRetrieveByStationIdQuery,
} from "@/shared/api/generated/api";
import styles from "./SpaceLocation.module.css";

export type LocatedKind = "room" | "station" | "bench";

interface Line {
  label: string;
  value: string;
  current?: boolean;
}

/**
 * Where a room, station or bench is, top-down: site, building and floor, room, station, bench.
 * Rendered only inside a tooltip, so the details load on the first hover (one request per level,
 * cached afterwards) instead of with every table row.
 */
export function SpaceLocationTooltip({ kind, id }: { kind: LocatedKind; id: number }) {
  const bench = useLabsBenchesRetrieveByBenchIdQuery(kind === "bench" ? { benchId: id } : skipToken);
  const benchData = bench.data?.data;
  const stationId = kind === "station" ? id : benchData?.setup_location?.id;
  const station = useLabsStationsRetrieveByStationIdQuery(stationId != null ? { stationId } : skipToken);
  const stationData = station.data?.data;
  const roomId = kind === "room" ? id : stationData?.room?.id;
  const room = useLabsRoomsRetrieveByRoomIdQuery(roomId != null ? { roomId } : skipToken);
  const roomData = room.data?.data;

  const loading = bench.isFetching || station.isFetching || room.isFetching;
  const failed = bench.isError || station.isError || room.isError;

  const lines: Line[] = [];
  const site = [roomData?.city?.name, roomData?.country?.name].filter(Boolean).join(", ");
  if (site) lines.push({ label: "Site", value: site });
  const building = [roomData?.building?.name, roomData?.floor ? `Floor ${roomData.floor}` : ""].filter(Boolean).join(" · ");
  if (building) lines.push({ label: "Building", value: building });
  if (roomData) {
    lines.push({
      label: "Room",
      value: [roomData.name || roomData.sku, stationData?.slot?.name ? `slot ${stationData.slot.name}` : ""].filter(Boolean).join(" · "),
      current: kind === "room",
    });
  }
  if (stationData) {
    lines.push({
      label: "Station",
      value: [stationData.name || stationData.sku, benchData?.station_slot?.name ? `slot ${benchData.station_slot.name}` : ""].filter(Boolean).join(" · "),
      current: kind === "station",
    });
  } else if (kind !== "room" && benchData && !benchData.setup_location) {
    lines.push({ label: "Station", value: "Not placed on a station" });
  }
  if (benchData) lines.push({ label: "Bench", value: benchData.name || benchData.sku, current: true });
  if (kind === "station" && stationData && !stationData.room) lines.push({ label: "Room", value: "Not placed in a room" });

  if (lines.length === 0) {
    if (loading) return <Spin size="small" />;
    return <span>{failed ? "Location unavailable" : "No location recorded"}</span>;
  }
  return (
    <dl className={styles.tooltipPath} aria-label="Location">
      {lines.map((line) => (
        <div key={line.label} className={line.current ? styles.tooltipCurrent : undefined}>
          <dt>{line.label}</dt>
          <dd>{line.value}</dd>
        </div>
      ))}
      {loading && <Spin size="small" />}
    </dl>
  );
}
