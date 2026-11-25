import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

export type RenderQuality = "high" | "standard";

/**
 * Studio lighting built from procedural light panels (no HDR download), so metal and glass read correctly,
 * plus soft contact shadows on the floor.
 */
export function SceneLighting({ floorSize }: { floorSize: number }) {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#dceeff" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#8fb8ff" position={[-8, 3, 2]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#6ee7f9" position={[8, 2, -4]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[4, 5, 6]} scale={3} />
      </Environment>
      <ContactShadows
        position={[0, -1.395, 0.5]}
        scale={floorSize}
        resolution={1024}
        far={4}
        blur={2.4}
        opacity={0.55}
        color="#020617"
      />
    </>
  );
}

/**
 * Post-processing: ambient occlusion grounds objects, bloom makes status lights and screens glow, SMAA smooths
 * edges, and ACES tone mapping with a light vignette gives the filmic finish. "standard" skips the composer for
 * weak GPUs (the renderer's own ACES tone mapping still applies).
 */
export function SceneEffects({ quality }: { quality: RenderQuality }) {
  if (quality !== "high") return null;
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.9} distanceFalloff={0.6} intensity={2.2} quality="medium" halfRes color="#020617" />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.22} darkness={0.55} />
      <SMAA />
    </EffectComposer>
  );
}
