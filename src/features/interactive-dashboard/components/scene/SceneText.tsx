import { useEffect, useMemo } from "react";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

type Vector = [number, number, number];

const SCALE = 128; // canvas pixels per scene unit of font size

/**
 * Flat 3D label drawn with the browser's own fonts into a canvas texture. Unlike SDF text it needs no font
 * download, worker or font parsing, so it works offline and on restricted networks.
 */
export function SceneText({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  fontSize = 0.2,
  color = "#ffffff",
  anchorX = "center",
  letterSpacing = 0,
  renderOrder,
}: {
  children: string | number;
  position?: Vector;
  rotation?: Vector;
  fontSize?: number;
  color?: string;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "middle" | "bottom";
  letterSpacing?: number;
  renderOrder?: number;
}) {
  const text = String(children);
  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const font = `600 ${SCALE}px "Inter Variable", Inter, system-ui, sans-serif`;
    context.font = font;
    const spacing = letterSpacing * SCALE;
    const width = Math.ceil(context.measureText(text).width + spacing * text.length) + 8;
    const height = Math.ceil(SCALE * 1.3);
    canvas.width = width;
    canvas.height = height;
    context.font = font;
    context.fillStyle = color;
    context.textBaseline = "middle";
    if ("letterSpacing" in context) (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
    context.fillText(text, 4, height / 2);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.minFilter = LinearFilter;
    result.generateMipmaps = false;
    return { texture: result, aspect: width / height };
  }, [text, color, letterSpacing]);
  useEffect(() => () => texture.dispose(), [texture]);

  const height = fontSize * 1.3;
  const width = height * aspect;
  const offset = anchorX === "left" ? width / 2 : anchorX === "right" ? -width / 2 : 0;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[offset, 0, 0]} renderOrder={renderOrder}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
