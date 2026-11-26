import { useVisualModel } from "../../models/useVisualModel";
import { ImportedModel } from "../../models/ImportedModel";
import type { StationPosition } from "@/features/spaces/room/stationContents";
import { Part } from "./Part";

export type Bench = StationPosition["benches"][number];
type Device = Bench["equipment"][number];
const chassis = "#73879a",
  dark = "#172838",
  metal = "#bbc9d2";
const families = [
  ["network", /switch|router|network/],
  ["server", /server|storage|chassis/],
  ["power", /supply|power|battery|ups/],
  ["scope", /oscilloscope|scope|analy[sz]er/],
  ["meter", /meter|measurement/],
  ["computer", /laptop|computer|workstation|monitor/],
] as const;

function SchematicInstrument({
  device,
  selected,
}: {
  device: Device;
  selected: boolean;
}) {
  const classify = (value: string) =>
    families.find(([, pattern]) => pattern.test(value.toLowerCase()))?.[0];
  const family =
    classify(device.category?.name ?? "") ?? classify(device.name) ?? "generic";
  const accent = selected ? "#ffd06d" : "#69cfda";
  if (family === "computer")
    return (
      <>
        <Part
          size={[0.85, 0.07, 0.58]}
          position={[0, 0.035, 0]}
          color={chassis}
        />
        <Part
          size={[0.81, 0.49, 0.06]}
          position={[0, 0.29, -0.2]}
          color={dark}
        />
        <Part
          size={[0.72, 0.39, 0.02]}
          position={[0, 0.29, -0.16]}
          color={accent}
        />
      </>
    );
  const low = family === "network" || family === "server";
  const height = low ? 0.2 : family === "meter" ? 0.48 : 0.38;
  const width = family === "meter" ? 0.48 : 0.94;
  return (
    <>
      <Part
        size={[width, height, 0.66]}
        position={[0, height / 2, 0]}
        color={chassis}
      />
      <Part
        size={[width * 0.94, height * 0.85, 0.035]}
        position={[0, height / 2, 0.333]}
        color={dark}
      />
      {low ? (
        Array.from({ length: family === "network" ? 8 : 4 }, (_, i) => {
          const count = family === "network" ? 8 : 4;
          return (
            <Part
              key={i}
              size={[0.67 / count, 0.078, 0.024]}
              position={[
                ((i + 0.5 - count / 2) * 0.84) / count,
                height * 0.52,
                0.36,
              ]}
              color={family === "network" ? metal : "#48667a"}
            />
          );
        })
      ) : (
        <>
          <Part
            size={[width * 0.52, height * 0.51, 0.02]}
            position={[-width * 0.13, height * 0.57, 0.36]}
            color={accent}
          />
          {(family === "power" ? ["#e05e50", "#263747"] : [metal, metal]).map(
            (color, i) => (
              <mesh
                key={i}
                position={[width * 0.31, height * (0.32 + i * 0.37), 0.372]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.034, 0.034, 0.06, 12]} />
                <meshStandardMaterial color={color} />
              </mesh>
            ),
          )}
        </>
      )}
    </>
  );
}

function Instrument({
  device,
  selected,
}: {
  device: Device;
  selected: boolean;
}) {
  // The server resolves the device's own model, then its product model's, then its category's.
  const model = useVisualModel(device.visual_model_id);
  const fallback = <SchematicInstrument device={device} selected={selected} />;
  return model ? (
    <ImportedModel
      model={model}
      dimensions={[0.94, 0.65, 0.66]}
      fallback={fallback}
    />
  ) : (
    fallback
  );
}

export function BenchAssembly({
  bench,
  width,
  depth,
  onInspect,
  selected,
}: {
  bench: Bench;
  width: number;
  depth: number;
  onInspect?: (id: number) => void;
  selected?: number;
}) {
  const model = useVisualModel(bench.visual_model_id);
  const devices = [...bench.equipment].sort(
    (a, b) =>
      (a.bench_assignment?.position ?? Infinity) -
        (b.bench_assignment?.position ?? Infinity) || a.id - b.id,
  );
  const cols = Math.min(
    devices.length || 1,
    Math.max(1, Math.ceil(Math.sqrt((devices.length * width) / depth))),
  );
  const rows = Math.max(1, Math.ceil(devices.length / cols));
  const unit = Math.min(width, depth);
  const surface = (
    <>
      <Part
        size={[width, unit * 0.06, depth]}
        position={[0, unit * 0.03, 0]}
        color="#496461"
      />
      <Part
        size={[width, unit * 0.09, depth * 0.05]}
        position={[0, unit * 0.095, -depth * 0.47]}
        color={metal}
      />
    </>
  );
  const content = (
    surfaceHeight: number,
    footprint: [number, number] = [width, depth],
  ) => {
    const fittedW = (footprint[0] * 0.9) / cols,
      fittedD = (footprint[1] * 0.82) / rows;
    const fittedScale = Math.min(fittedW, fittedD / 0.82, 0.6);
    return (
      <>
        {devices.map((device, i) => (
          <group
            key={device.id}
            name={device.name}
            position={[
              ((i % cols) + 0.5 - cols / 2) * fittedW,
              surfaceHeight,
              (Math.floor(i / cols) + 0.5 - rows / 2) * fittedD,
            ]}
            scale={fittedScale}
            onClick={
              onInspect
                ? (e) => {
                    if (e.delta < 5) {
                      e.stopPropagation();
                      onInspect(device.id);
                    }
                  }
                : undefined
            }
          >
            <Instrument device={device} selected={selected === device.id} />
          </group>
        ))}
      </>
    );
  };
  if (model)
    return (
      <group name={bench.name}>
        <ImportedModel
          model={model}
          dimensions={[width, Math.min(width, depth) * 0.8, depth]}
          fallback={
            <>
              {surface}
              {content(unit * 0.06)}
            </>
          }
        >
          {(height, footprint) => content(height, footprint)}
        </ImportedModel>
      </group>
    );
  return (
    <group name={bench.name}>
      {surface}
      {content(unit * 0.06)}
    </group>
  );
}
