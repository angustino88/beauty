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
  ["vector", /vector|vn16\d+|vn56\d+|vn76\d+|vn89\d+|vt80\d+|vt\s?system|cancase/],
  ["lauterbach", /lauterbach|trace32|powerdebug/],
  ["rpi", /raspberry|\brpi\b|sbc/],
  ["board", /embedded|board|devkit|dut|ecu|mcu|fpga|microcontroller|target|nucleo|stm32|adas/],
  ["debugger", /debug|jtag|swd|logic|probe|trace|segger|j-?link|saleae/],
  ["solder", /solder|rework|hotair|weller|hakko/],
  ["rf", /spectrum|vna|\brf\b|signal|waveform|awg|33522|generator/],
  ["network", /switch|router|network|ethernet|catalyst/],
  ["server", /server|storage|chassis/],
  ["power", /supply|power|battery|ups|pdu|dp831|rigol|toellner|toe\s?89|itech|it8512|electronic\s?load/],
  ["scope", /oscilloscope|scope|mso|dso|analy[sz]er/],
  ["meter", /meter|measurement|fluke|dmm|34461|microscope/],
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
    classify(device.name) ?? classify(device.category?.name ?? "") ?? "generic";
  const accent = selected ? "#ffd06d" : "#69cfda";
  if (family === "vector")
    return (
      <>
        <Part size={[0.82, 0.24, 0.56]} position={[0, 0.12, 0]} color={dark} />
        <Part size={[0.86, 0.26, 0.06]} position={[0, 0.13, 0.22]} color="#c8102e" />
        <Part size={[0.86, 0.26, 0.06]} position={[0, 0.13, -0.22]} color="#c8102e" />
        <Part size={[0.72, 0.02, 0.36]} position={[0, 0.25, 0]} color="#f1f5f9" />
        <Part size={[0.62, 0.025, 0.10]} position={[0, 0.26, -0.02]} color="#c8102e" />
        <Part size={[0.20, 0.09, 0.06]} position={[-0.22, 0.12, 0.30]} color={metal} />
        <Part size={[0.20, 0.09, 0.06]} position={[0.08, 0.12, 0.30]} color={metal} />
      </>
    );
  if (family === "lauterbach")
    return (
      <>
        <Part size={[0.52, 0.16, 0.88]} position={[0, 0.08, 0]} color="#eef2f6" />
        <Part size={[0.42, 0.10, 0.28]} position={[0, 0.18, -0.02]} color={dark} />
        <Part size={[0.18, 0.06, 0.22]} position={[-0.12, 0.17, -0.32]} color="#1e293b" />
        <Part size={[0.18, 0.06, 0.22]} position={[0.12, 0.17, -0.32]} color="#1e293b" />
        <Part size={[0.10, 0.08, 0.04]} position={[-0.08, 0.08, 0.45]} color="#0284c7" />
        <Part size={[0.05, 0.02, 0.05]} position={[0.16, 0.17, 0.30]} color="#34d399" glow />
      </>
    );
  if (family === "rpi")
    return (
      <>
        <Part size={[0.86, 0.04, 0.58]} position={[0, 0.02, 0]} color="#15803d" />
        <Part size={[0.56, 0.06, 0.07]} position={[-0.08, 0.07, -0.23]} color="#eab308" />
        <Part size={[0.16, 0.05, 0.16]} position={[-0.06, 0.065, 0.02]} color={metal} />
        <Part size={[0.18, 0.14, 0.16]} position={[0.35, 0.11, -0.14]} color={metal} />
        <Part size={[0.16, 0.14, 0.14]} position={[0.35, 0.11, 0.06]} color="#2563eb" />
        <Part size={[0.16, 0.14, 0.14]} position={[0.35, 0.11, 0.22]} color={metal} />
      </>
    );
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
  if (family === "board")
    return (
      <>
        <Part size={[0.88, 0.04, 0.66]} position={[0, 0.02, 0]} color="#14532d" />
        <Part size={[0.26, 0.14, 0.26]} position={[-0.08, 0.11, -0.02]} color="#334155" />
        <Part size={[0.24, 0.22, 0.04]} position={[0.26, 0.15, -0.04]} color={accent} glow />
        <Part size={[0.52, 0.06, 0.06]} position={[-0.04, 0.07, -0.24]} color="#eab308" />
        <Part size={[0.14, 0.08, 0.10]} position={[-0.28, 0.08, 0.25]} color={metal} />
      </>
    );
  if (family === "debugger")
    return (
      <>
        <Part size={[0.76, 0.16, 0.52]} position={[0, 0.08, 0]} color={dark} />
        <Part size={[0.72, 0.03, 0.48]} position={[0, 0.175, 0]} color="#38bdf8" glow />
        <Part size={[0.32, 0.07, 0.06]} position={[-0.14, 0.08, 0.28]} color="#eab308" />
        <Part size={[0.08, 0.02, 0.06]} position={[0.22, 0.195, 0.12]} color="#34d399" glow />
      </>
    );
  if (family === "solder")
    return (
      <>
        <Part size={[0.54, 0.32, 0.56]} position={[-0.14, 0.16, 0]} color="#1e3a5f" />
        <Part size={[0.42, 0.14, 0.02]} position={[-0.14, 0.22, 0.29]} color="#f59e0b" glow />
        <Part size={[0.26, 0.06, 0.44]} position={[0.30, 0.03, 0.02]} color={dark} />
        <Part size={[0.08, 0.34, 0.08]} position={[0.30, 0.22, -0.02]} color="#d97706" />
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
        color={family === "rf" ? "#cbd5e1" : chassis}
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
            color={family === "rf" ? "#f59e0b" : accent}
            glow
          />
          {(family === "power"
            ? ["#e05e50", "#263747"]
            : family === "rf"
              ? ["#eab308", metal]
              : [metal, metal]
          ).map((color, i) => (
            <mesh
              key={i}
              position={[width * 0.31, height * (0.32 + i * 0.37), 0.372]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.034, 0.034, 0.06, 12]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
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
