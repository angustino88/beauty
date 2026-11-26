import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrthographicCamera, Vector3 } from "three";
import type { FloorSpec } from "../../types";

type Preset = "isometric" | "top" | "front";

const ROOM_TARGET = new Vector3(0, -0.3, 0.5);

function presetDirection(preset: Preset, span: number) {
  return preset === "top"
    ? new Vector3(0, span, 0.001)
    : preset === "front"
      ? new Vector3(0, span * 0.12, span)
      : new Vector3(span, span * 0.9, span);
}

/**
 * Orbit camera with animated transitions: switching view, fitting the room and focusing a station glide
 * instead of jumping. Any user drag or zoom stops the current animation.
 */
export function CameraRig({
  floor,
  preset,
  resetKey,
  enabled,
  focus,
}: {
  floor: FloorSpec;
  preset: Preset;
  resetKey: string;
  enabled: boolean;
  /** Station position to fly to, or null to show the whole room. */
  focus?: [number, number, number] | null;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const size = useThree((state) => state.size);
  const goal = useRef<{ position: Vector3; target: Vector3; zoom: number } | null>(null);
  const firstFrame = useRef(true);

  const focusKey = focus ? focus.join(",") : "room";
  useEffect(() => {
    const { floorWidth: w, floorDepth: d } = floor;
    const span = Math.max(w, d);
    const direction = presetDirection(preset, span);
    let target = ROOM_TARGET.clone();
    let zoom: number;
    if (focus) {
      target = new Vector3(focus[0], -0.7, focus[2]);
      // Frame the station with its neighbours: roughly a 14 × 10 unit area.
      zoom = Math.min(size.width / 14, size.height / 10) * 0.85;
    } else {
      const projectedW = preset === "isometric" ? (w + d) * 0.72 : w;
      const projectedH =
        preset === "top" ? d : preset === "front" ? d * 0.12 + 4 : (w + d) * 0.42 + 3;
      zoom = Math.max(
        5,
        Math.min(size.width / (projectedW + 4), size.height / (projectedH + 5)) * 0.86,
      );
    }
    goal.current = { position: target.clone().add(direction), target, zoom: Math.min(zoom, 220) };
  }, [floor.floorWidth, floor.floorDepth, preset, resetKey, focusKey, size.width, size.height]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    // The user takes over: stop gliding towards the last goal.
    const stop = () => {
      goal.current = null;
    };
    orbit.addEventListener("start", stop);
    return () => orbit.removeEventListener("start", stop);
  }, []);

  useFrame((state, delta) => {
    const next = goal.current;
    const orbit = controls.current;
    if (!next || !orbit) return;
    const camera = state.camera;
    // Jump on the first frame so the room never animates in from the default camera.
    const t = firstFrame.current ? 1 : 1 - Math.exp(-delta * 4.5);
    firstFrame.current = false;
    camera.position.lerp(next.position, t);
    orbit.target.lerp(next.target, t);
    if (camera instanceof OrthographicCamera) {
      camera.zoom += (next.zoom - camera.zoom) * t;
      camera.updateProjectionMatrix();
    }
    orbit.update();
    const settled =
      camera.position.distanceToSquared(next.position) < 1e-4 &&
      orbit.target.distanceToSquared(next.target) < 1e-4 &&
      (!(camera instanceof OrthographicCamera) || Math.abs(camera.zoom - next.zoom) < 0.05);
    if (settled) goal.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={enabled}
      enableDamping
      dampingFactor={0.12}
      minZoom={5}
      maxZoom={220}
      maxPolarAngle={Math.PI / 2 - 0.02}
    />
  );
}
