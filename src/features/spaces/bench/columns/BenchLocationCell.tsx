import { Tooltip } from "antd";
import { Link } from "react-router-dom";
import { pageIcons } from "@/components/layout/pageIcons";
import type { IBench } from "../types";
import { benchLocationView } from "./benchLocation";
import styles from "./BenchLocationCell.module.css";

/** Station on the first line, its room underneath; one of each, never the station twice. */
export function BenchLocationCell({ bench }: { bench: IBench }) {
  const { station } = bench;
  const { roomLabel, path } = benchLocationView(bench);

  if (!station && !roomLabel) return <span className={styles.muted}>Unplaced</span>;

  const roomLink = bench.room
    ? `/spaces/room?search=${encodeURIComponent(bench.room.sku)}`
    : null;

  return (
    <Tooltip title={path ? `Location: ${path}` : undefined} placement="topLeft">
      <div className={styles.cell}>
        <div className={styles.row}>
          <span className={`${styles.icon} ${styles.stationIcon}`} aria-hidden>{pageIcons.stations}</span>
          {station ? (
            <Link
              className={styles.station}
              to={`/spaces/station?search=${encodeURIComponent(station.sku)}`}
              aria-label={`Station ${station.name || station.sku}`}
            >
              {station.name || station.sku}
            </Link>
          ) : (
            <span className={styles.muted}>No station</span>
          )}
          {bench.station_slot_name ? <span className={styles.slot}>Slot {bench.station_slot_name}</span> : null}
        </div>
        <div className={styles.row}>
          <span className={`${styles.icon} ${styles.roomIcon}`} aria-hidden>{pageIcons.rooms}</span>
          {roomLabel ? (
            roomLink ? (
              <Link className={styles.room} to={roomLink} aria-label={`Room ${roomLabel}`}>{roomLabel}</Link>
            ) : (
              <span className={styles.room}>{roomLabel}</span>
            )
          ) : (
            <span className={styles.muted}>No room</span>
          )}
        </div>
      </div>
    </Tooltip>
  );
}
