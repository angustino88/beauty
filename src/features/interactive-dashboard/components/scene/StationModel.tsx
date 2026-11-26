import { useVisualModel } from "../../models/useVisualModel";
import { ImportedModel } from "../../models/ImportedModel";
import type { RackData } from "../../types";

import { Part } from "./Part";
import { BenchAssembly } from "./BenchAssembly";
import { categoryColor } from "../../utils/categoryColor";
/** Procedural silhouettes; decorative rack panels do not represent installed equipment. */
function SchematicStationModel({
  rack,
  color,
}: {
  rack: RackData;
  color: string;
}) {
  const [w, h, d] = rack.dimensions;
  const kind = rack.modelKind;

  return (
    <group position={[0, -1.4, 0]} rotation={[0, rack.rotation, 0]}>
      <Part
        position={[0, 0.035, 0]}
        size={[w + 0.08, 0.07, d + 0.08]}
        color="#172638"
      />
      {kind === "table" || kind === "shelf" ? (
        <>
          {kind === "table" && (
            <StationContents rack={rack} surfaceHeight={h + 0.04} />
          )}
          {[-1, 1].flatMap((x) =>
            [-1, 1].map((z) => (
              <Part
                key={`${x}-${z}`}
                position={[x * (w / 2 - 0.06), h / 2, z * (d / 2 - 0.06)]}
                size={[0.07, h, 0.07]}
                color="#64748b"
              />
            )),
          )}
          {(kind === "table" ? [h] : [0.15, h * 0.36, h * 0.68, h]).map((y) => (
            <Part
              key={y}
              position={[0, y, 0]}
              size={[w, 0.07, d]}
              color={kind === "table" ? "#b6a589" : "#71879a"}
            />
          ))}
          <Part
            position={[0, h - 0.09, d / 2]}
            size={[w, 0.06, 0.035]}
            color={color}
            glow
          />
          {kind === "table" && (
            <Part
              position={[0, h * 0.25, -d / 2 + 0.06]}
              size={[w, 0.08, 0.06]}
              color="#64748b"
            />
          )}
        </>
      ) : (
        <>
          <Part
            position={[0, h / 2, 0]}
            size={[w, h, d]}
            color={kind === "generic" ? "#66788a" : "#253549"}
          />
          <Part
            position={[0, h / 2, d / 2 + 0.012]}
            size={[w * 0.85, h * 0.87, 0.025]}
            color="#122031"
          />
          {kind === "rack" &&
            (rack.capacity?.rack_units ? (
              <RackUnits rack={rack} width={w} height={h} depth={d} />
            ) : (
              Array.from({ length: 12 }, (_, i) => (
                <Part
                  key={i}
                  position={[0, h * (0.12 + i * 0.065), d / 2 + 0.03]}
                  size={[w * 0.74, h * 0.038, 0.025]}
                  color="#3b5066"
                />
              ))
            ))}
          {kind === "cabinet" && (
            <Part
              position={[w * 0.28, h * 0.52, d / 2 + 0.04]}
              size={[0.035, h * 0.15, 0.04]}
              color="#9bafc2"
            />
          )}
          <Part
            position={[0, h - 0.07, d / 2 + 0.03]}
            size={[w * 0.85, 0.045, 0.04]}
            color={color}
            glow
          />
          <Part
            position={[0, h + 0.025, 0]}
            size={[w + 0.04, 0.05, d + 0.04]}
            color="#42566c"
          />
        </>
      )}
    </group>
  );
}

/** Rack elevation in 3D: rails with unit marks, and each mounted unit at its real position and height. */
function RackUnits({
  rack,
  width,
  height,
  depth,
}: {
  rack: RackData;
  width: number;
  height: number;
  depth: number;
}) {
  const units = rack.capacity?.rack_units ?? 42;
  const bottom = height * 0.07;
  const unitHeight = (height * 0.86) / units;
  return (
    <>
      {[-1, 1].map((side) => (
        <Part
          key={side}
          position={[side * width * 0.41, bottom + (unitHeight * units) / 2, depth / 2 + 0.03]}
          size={[width * 0.04, unitHeight * units, 0.02]}
          color="#64748b"
        />
      ))}
      {(rack.rackItems ?? []).map((item) => {
        const face = item.rack_face === "rear" ? -1 : 1;
        const itemHeight = unitHeight * item.rack_unit_height * 0.94;
        const y = bottom + unitHeight * (item.rack_unit - 1) + (unitHeight * item.rack_unit_height) / 2;
        const color = categoryColor(item.category);
        return (
          <group key={item.equipment_id} position={[0, y, face * (depth / 2 + 0.035)]}>
            <Part position={[0, 0, 0]} size={[width * 0.78, itemHeight, 0.03]} color="#1e293b" />
            <Part position={[-width * 0.26, 0, face * 0.017]} size={[width * 0.2, itemHeight * 0.5, 0.01]} color={color} glow />
            <Part position={[width * 0.3, 0, face * 0.017]} size={[0.03, Math.min(0.03, itemHeight * 0.4), 0.01]} color="#34d399" glow />
          </group>
        );
      })}
    </>
  );
}

function StationContents({
  rack,
  surfaceHeight,
  footprint,
}: {
  rack: RackData;
  surfaceHeight: number;
  footprint?: [number, number];
}) {
  const [w, d] = footprint ?? [rack.dimensions[0], rack.dimensions[2]];
  const slots = rack.slots ?? [];
  // Configured position widths lay benches out side by side in proportion; otherwise an even grid.
  const widths = slots.map((slot) => slot.width_mm ?? 0);
  const proportional = slots.length > 0 && widths.every((value) => value > 0);
  const total = widths.reduce((sum, value) => sum + value, 0);
  const columns = proportional ? slots.length : Math.max(1, Math.ceil(Math.sqrt((slots.length * w) / d)));
  const rows = proportional ? 1 : Math.max(1, Math.ceil(slots.length / columns));
  const starts = widths.map((_, index) => widths.slice(0, index).reduce((sum, value) => sum + value, 0));
  return (
    <>
      {slots.map((slot, index) => {
        const width = proportional ? (w * widths[index]) / total : w / columns,
          depth = d / rows;
        const x = proportional
          ? (w * starts[index]) / total + width / 2 - w / 2
          : ((index % columns) + 0.5) * width - w / 2;
        const benchWidth = (width * 0.94) / Math.max(1, slot.benches.length);
        return (
          <group
            key={slot.id}
            position={[
              x,
              surfaceHeight,
              (Math.floor(index / columns) + 0.5) * depth - d / 2,
            ]}
          >
            {slot.benches.map((bench, i) => (
              <group
                key={bench.id}
                position={[
                  (i + 0.5 - slot.benches.length / 2) * benchWidth,
                  0,
                  0,
                ]}
              >
                <BenchAssembly
                  bench={bench}
                  width={benchWidth * 0.96}
                  depth={depth * 0.9}
                />
              </group>
            ))}
          </group>
        );
      })}
    </>
  );
}

export function StationModel({
  rack,
  color,
}: {
  rack: RackData;
  color: string;
}) {
  const model = useVisualModel(rack.visualModelId);
  const fallback = <SchematicStationModel rack={rack} color={color} />;
  if (!model) return fallback;
  return (
    <group position={[0, -1.4, 0]} rotation={[0, rack.rotation, 0]}>
      <ImportedModel
        model={model}
        dimensions={rack.dimensions}
        fallback={
          <group position={[0, 1.4, 0]} rotation={[0, -rack.rotation, 0]}>
            {fallback}
          </group>
        }
      >
        {(height, footprint) =>
          // Like the schematic view, work tables carry their benches and racks show their mounted units.
          rack.modelKind === "table" ? (
            <StationContents
              rack={rack}
              surfaceHeight={height + 0.01}
              footprint={footprint}
            />
          ) : rack.modelKind === "rack" && rack.capacity?.rack_units ? (
            <RackUnits
              rack={rack}
              width={footprint[0]}
              height={height}
              depth={footprint[1]}
            />
          ) : null
        }
      </ImportedModel>
    </group>
  );
}
