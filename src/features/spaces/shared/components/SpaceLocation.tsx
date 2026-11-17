import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { pageIcons } from "@/components/layout/pageIcons";
import styles from "./SpaceLocation.module.css";

export type SpaceRefKind = "room" | "station" | "bench";

const PAGE_PATH: Record<SpaceRefKind, string> = {
  room: "/spaces/room",
  station: "/spaces/station",
  bench: "/spaces/bench",
};

const ICON: Record<SpaceRefKind, ReactNode> = {
  room: pageIcons.rooms,
  station: pageIcons.stations,
  bench: pageIcons.benches,
};

const KIND_LABEL: Record<SpaceRefKind, string> = { room: "Room", station: "Station", bench: "Bench" };

interface SpaceLocationRowProps {
  kind: SpaceRefKind;
  /** Text shown, normally the name, else the SKU. Null renders `emptyLabel` in muted italics. */
  label: string | null | undefined;
  /** What the link searches for on the space's page; defaults to the label. */
  searchKey?: string | null;
  /** Slot code inside the parent, shown as a small pill. */
  slot?: string | null;
  /** First line of a location cell: stronger text. */
  primary?: boolean;
  emptyLabel?: string;
}

/**
 * One place in a location cell: the space type's icon, a link to that space, and its slot.
 * Every table that names a room, station or bench uses this, so places read the same everywhere.
 */
export function SpaceLocationRow({ kind, label, searchKey, slot, primary = false, emptyLabel }: SpaceLocationRowProps) {
  const text = label?.trim();
  const search = (searchKey ?? text)?.trim();
  return (
    <div className={styles.row}>
      <span className={`${styles.icon} ${primary ? styles.primaryIcon : styles.secondaryIcon}`} aria-hidden>{ICON[kind]}</span>
      {text ? (
        search ? (
          <Link
            className={primary ? styles.primary : styles.secondary}
            to={`${PAGE_PATH[kind]}?search=${encodeURIComponent(search)}`}
            aria-label={`${KIND_LABEL[kind]} ${text}`}
          >
            {text}
          </Link>
        ) : (
          <span className={primary ? styles.primary : styles.secondary}>{text}</span>
        )
      ) : (
        <span className={styles.muted}>{emptyLabel ?? `No ${kind}`}</span>
      )}
      {slot ? <span className={styles.slot}>Slot {slot}</span> : null}
    </div>
  );
}

/** Stack of location rows (e.g. station over room). */
export function SpaceLocationStack({ children }: { children: ReactNode }) {
  return <div className={styles.cell}>{children}</div>;
}

export function SpaceLocationEmpty({ label }: { label: string }) {
  return <span className={styles.muted}>{label}</span>;
}
