import type { FloorSpec, RackData, SlotAnchor } from "../../types";
import { STATUS_COLORS, TYPE_COLORS } from "../../utils/stationVisual";
import { FLOOR_Z_OFFSET } from "../../utils/slotGrid";
import { heatHex, normalise, overlayDomain, overlayValue, type Overlay } from "../../utils/overlays";

interface MiniMapProps {
  floor: FloorSpec;
  slots: SlotAnchor[];
  racks: RackData[];
  selectedId: number | null;
  colorMode: "status" | "type";
  overlay: Overlay;
  matchedIds?: Set<number> | null;
  onSelect: (id: number) => void;
}

/** Interactive 2D top-down DCIM floorplan mini-map with click-to-focus. */
export function MiniMap({
  floor,
  slots,
  racks,
  selectedId,
  colorMode,
  overlay,
  matchedIds,
  onSelect,
}: MiniMapProps) {
  const pad = 0.8;
  const vbW = floor.floorWidth + pad * 2;
  const vbH = floor.floorDepth + pad * 2;
  const minX = -floor.floorWidth / 2 - pad;
  const minZ = FLOOR_Z_OFFSET - floor.floorDepth / 2 - pad;
  const domain = overlayDomain(racks, overlay);

  return (
    <div className="dcim-minimap" aria-label="2D floorplan mini-map">
      <div className="dcim-minimap-head">
        <span>FLOORPLAN</span>
        <small>{floor.measured ? `${floor.floorWidth.toFixed(1)}×${floor.floorDepth.toFixed(1)} m` : `${floor.rows}×${floor.cols}`}</small>
      </div>
      <svg
        viewBox={`${minX} ${minZ} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Room top-down plan"
      >
        <rect
          x={-floor.floorWidth / 2}
          y={FLOOR_Z_OFFSET - floor.floorDepth / 2}
          width={floor.floorWidth}
          height={floor.floorDepth}
          rx={0.18}
          fill="#0c1828"
          stroke="#2d4460"
          strokeWidth={0.08}
        />
        {slots.map((slot) => {
          const [w, d] = slot.size;
          const isAisle = slot.slotType === "aisle";
          const isSafety = slot.slotType === "safety";
          return (
            <rect
              key={slot.id}
              x={slot.position[0] - w / 2}
              y={slot.position[2] - d / 2}
              width={w}
              height={d}
              fill={
                isSafety
                  ? "rgba(250, 204, 21, 0.16)"
                  : isAisle
                    ? "rgba(100, 116, 139, 0.14)"
                    : "rgba(30, 49, 73, 0.45)"
              }
              stroke="#243a54"
              strokeWidth={0.04}
            />
          );
        })}
        {racks.map((rack) => {
          if (!rack.position) return null;
          const [w, , d] = rack.dimensions;
          const rw = Math.max(w, 0.55);
          const rd = Math.max(d, 0.55);
          const isSelected = rack.id === selectedId;
          const val = overlayValue(rack, overlay);
          let fill =
            colorMode === "type" ? TYPE_COLORS[rack.modelKind] : STATUS_COLORS[rack.status];
          if (overlay !== "none" && val != null) {
            fill = heatHex(normalise(val, domain));
          }
          let opacity = 0.88;
          if (matchedIds) {
            if (matchedIds.has(rack.id)) {
              fill = "#10b981";
              opacity = 1;
            } else {
              opacity = 0.22;
            }
          }
          return (
            <g
              key={rack.id}
              transform={`translate(${rack.position[0]}, ${rack.position[2]}) rotate(${(-rack.rotation * 180) / Math.PI})`}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(rack.id)}
            >
              <title>{`${rack.name}${rack.slotCode ? ` (${rack.slotCode})` : ""}`}</title>
              <rect
                x={-rw / 2}
                y={-rd / 2}
                width={rw}
                height={rd}
                rx={0.08}
                fill={fill}
                fillOpacity={opacity}
                stroke={isSelected ? "#e0f2fe" : "#0b1523"}
                strokeWidth={isSelected ? 0.14 : 0.06}
              />
            </g>
          );
        })}
        {/* Front orientation indicator */}
        <text
          x={0}
          y={FLOOR_Z_OFFSET + floor.floorDepth / 2 + pad * 0.62}
          textAnchor="middle"
          fontSize={Math.max(0.32, Math.min(floor.floorWidth, floor.floorDepth) * 0.06)}
          fill="#64748b"
          letterSpacing="0.08em"
        >
          FRONT
        </text>
      </svg>
    </div>
  );
}
