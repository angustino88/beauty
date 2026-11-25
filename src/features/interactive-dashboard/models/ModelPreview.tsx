import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ImportedModel } from "./ImportedModel";
import type { VisualModel } from "./api";

/** Interactive preview of one library model, with its work surface shown as a translucent plane. */
export function ModelPreview({
  model,
  height = 360,
  showSurface = true,
  onError,
}: {
  model?: VisualModel;
  height?: number;
  showSurface?: boolean;
  onError?: () => void;
}) {
  return (
    <div
      style={{
        height,
        borderRadius: 8,
        overflow: "hidden",
        background: "#102235",
        display: "grid",
        placeItems: "center",
        color: "#a8bad1",
      }}
    >
      {model ? (
        <Canvas camera={{ position: [3, 2.3, 4], fov: 40 }}>
          <color attach="background" args={["#102235"]} />
          <ambientLight intensity={1.3} />
          <directionalLight position={[4, 6, 4]} intensity={2} />
          <ImportedModel
            model={model}
            dimensions={[2, 1.5, 1.5]}
            fallback={null}
            onError={onError}
          >
            {(height) =>
              showSurface && (
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, height + 0.005, 0]}
                >
                  <planeGeometry args={[2, 1.5]} />
                  <meshBasicMaterial
                    color="#64d4d5"
                    transparent
                    opacity={0.25}
                    depthWrite={false}
                  />
                </mesh>
              )
            }
          </ImportedModel>
          <gridHelper args={[5, 10, "#42647b", "#264158"]} />
          <OrbitControls makeDefault target={[0, 0.6, 0]} />
        </Canvas>
      ) : (
        <span>Choose a GLB file to preview it.</span>
      )}
    </div>
  );
}
