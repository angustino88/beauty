import { useEffect, useMemo } from "react";
import { CanvasTexture } from "three";
import type { RackData } from "../../types";
import { computeFloorDimensions } from "../../utils/slotGrid";
import { heatColor, normalise, overlayDomain, overlayValue, type Overlay } from "../../utils/overlays";

const FLOOR_Y = -1.395;
const FLOOR_Z_OFFSET = 0.5;
const RESOLUTION = 256;

/**
 * Floor heatmap: each station with a reading spreads a soft blob of its value across the floor, blended by
 * distance (inverse-distance weighting), and the opacity fades out where no station is near.
 */
export function HeatmapLayer({
  racks,
  overlay,
  rows,
  cols,
}: {
  racks: RackData[];
  overlay: Overlay;
  rows?: number | null;
  cols?: number | null;
}) {
  const { floorWidth, floorDepth } = computeFloorDimensions(rows, cols);
  const points = useMemo(
    () =>
      racks.flatMap((rack) => {
        const value = overlayValue(rack, overlay);
        return rack.position && value != null ? [{ x: rack.position[0], z: rack.position[2], value }] : [];
      }),
    [racks, overlay],
  );
  const domain = useMemo(() => overlayDomain(racks, overlay), [racks, overlay]);

  const texture = useMemo(() => {
    const width = RESOLUTION;
    const height = Math.max(32, Math.round((RESOLUTION * floorDepth) / floorWidth));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d")!;
    const image = context.createImageData(width, height);
    const radius = Math.max(2.2, Math.min(floorWidth, floorDepth) * 0.18);
    for (let py = 0; py < height; py++) {
      const z = FLOOR_Z_OFFSET - floorDepth / 2 + ((py + 0.5) / height) * floorDepth;
      for (let px = 0; px < width; px++) {
        const x = -floorWidth / 2 + ((px + 0.5) / width) * floorWidth;
        let weighted = 0;
        let weights = 0;
        let nearest = Infinity;
        for (const point of points) {
          const distance = Math.hypot(point.x - x, point.z - z);
          nearest = Math.min(nearest, distance);
          const weight = 1 / (distance * distance + 0.35);
          weighted += point.value * weight;
          weights += weight;
        }
        const offset = (py * width + px) * 4;
        if (!weights) continue;
        const [r, g, b] = heatColor(normalise(weighted / weights, domain));
        const presence = Math.exp(-((nearest / radius) ** 2));
        image.data[offset] = r;
        image.data[offset + 1] = g;
        image.data[offset + 2] = b;
        image.data[offset + 3] = Math.round(presence * 170);
      }
    }
    context.putImageData(image, 0, 0);
    const result = new CanvasTexture(canvas);
    result.needsUpdate = true;
    return result;
  }, [points, domain, floorWidth, floorDepth]);

  useEffect(() => () => texture.dispose(), [texture]);

  if (!points.length) return null;
  return (
    <mesh position={[0, FLOOR_Y, FLOOR_Z_OFFSET]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[floorWidth, floorDepth]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
