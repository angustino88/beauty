import type { IStation } from "../../spaces/station/types";
import type { RackData } from "../types";

export const TYPE_COLORS = {
  rack: "#63b3ed",
  table: "#c4a574",
  cabinet: "#a69af5",
  shelf: "#5ed3c5",
  generic: "#94a3b8",
};
export const STATUS_COLORS = {
  ok: "#34d399",
  warning: "#fbbf24",
  critical: "#fb7185",
  unknown: "#94a3b8",
};
export const TYPE_LABELS = {
  rack: "Rack",
  table: "Table / workbench",
  cabinet: "Cabinet",
  shelf: "Shelving",
  generic: "Other / unspecified",
};

export function stationVisual(
  station: Pick<
    IStation,
    "type" | "width_mm" | "height_mm" | "depth_mm" | "orientation_degrees"
  >,
  { trueScale = false }: { trueScale?: boolean } = {},
) {
  const name = station.type?.name?.trim() || null;
  const tokens = (name ?? "").toLowerCase().split(/[^a-z0-9]+/);
  const has = (...words: string[]) =>
    words.some((word) => tokens.includes(word));
  const modelKind: RackData["modelKind"] = has(
    "rack",
    "racks",
    "hil",
    "simulator",
    "testbench",
  )
    ? "rack"
    : has(
          "table",
          "desk",
          "bench",
          "workbench",
          "workstation",
          "fume",
          "hood",
          "cart",
          "trolley",
          "gantry",
        )
      ? "table"
      : has("cabinet", "enclosure", "locker", "flammable", "safety", "drawer", "drawers")
        ? "cabinet"
        : has("shelf", "shelves", "shelving")
          ? "shelf"
          : "generic";
  const defaults = {
    rack: [0.8, 2.2, 1],
    table: [1.8, 0.9, 0.85],
    cabinet: [1.1, 1.8, 0.8],
    shelf: [1.5, 1.8, 0.65],
    generic: [1.1, 1.1, 0.85],
  }[modelKind];
  const dimension = (mm: number | null | undefined, fallback: number) =>
    mm != null && Number.isFinite(mm) && mm > 0 ? mm / 1000 : fallback;
  const dimensions: [number, number, number] = [
    dimension(station.width_mm, defaults[0]),
    dimension(station.height_mm, defaults[1]),
    dimension(station.depth_mm, defaults[2]),
  ];
  // Grid view: preserve proportions while fitting any orientation in a cell. A measured plan is true to scale.
  const scale = trueScale
    ? 1
    : Math.min(1, 1.85 / Math.hypot(dimensions[0], dimensions[2]), 2.8 / dimensions[1]);
  return {
    stationType: name,
    modelKind,
    dimensions: dimensions.map((value) => value * scale) as [
      number,
      number,
      number,
    ],
    rotation: Number.isFinite(station.orientation_degrees)
      ? -((station.orientation_degrees! * Math.PI) / 180)
      : 0,
  };
}
