import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrthographicCamera } from "three";
import { computeFloorDimensions } from "../../utils/slotGrid";

export function CameraRig({
  rows,
  cols,
  preset,
  resetKey,
  enabled,
}: {
  rows?: number | null;
  cols?: number | null;
  preset: "isometric" | "top" | "front";
  resetKey: string;
  enabled: boolean;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { get, size } = useThree();
  useEffect(() => {
    const { camera } = get();
    const { floorWidth: w, floorDepth: d } = computeFloorDimensions(rows, cols);
    const span = Math.max(w, d);
    const direction =
      preset === "top"
        ? [0, span, 0.001]
        : preset === "front"
          ? [0, span * 0.12, span]
          : [span, span * 0.9, span];
    camera.position.set(direction[0], direction[1], direction[2] + 0.5);
    camera.lookAt(0, -0.3, 0.5);
    if (camera instanceof OrthographicCamera) {
      const projectedW = preset === "isometric" ? (w + d) * 0.72 : w;
      const projectedH =
        preset === "top"
          ? d
          : preset === "front"
            ? d * 0.12 + 4
            : (w + d) * 0.42 + 3;
      camera.zoom = Math.max(
        5,
        Math.min(
          size.width / (projectedW + 4),
          size.height / (projectedH + 5),
        ) * 0.86,
      );
      camera.updateProjectionMatrix();
    }
    controls.current?.target.set(0, -0.3, 0.5);
    controls.current?.update();
  }, [get, size.width, size.height, rows, cols, preset, resetKey]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={enabled}
      minZoom={5}
      maxZoom={220}
      maxPolarAngle={Math.PI / 2 - 0.02}
    />
  );
}
