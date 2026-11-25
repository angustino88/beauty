import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import type { VisualModel } from "./api";

class ModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function LoadedModel({
  model,
  dimensions,
  children,
}: {
  model: VisualModel;
  dimensions: [number, number, number];
  children?: (surfaceHeight: number, footprint: [number, number]) => ReactNode;
}) {
  const { scene } = useGLTF(model.url, false, false);
  const [w, h, d] = dimensions;
  const { object, factor, center, bottom, height, footprint } = useMemo(() => {
    const object = scene.clone(true);
    object.rotation.y += (model.rotation * Math.PI) / 180;
    object.updateMatrixWorld(true);
    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3());
    if (
      ![size.x, size.y, size.z].every(
        (value) => Number.isFinite(value) && value > 0,
      )
    )
      throw new Error("Model has invalid bounds");
    const factor = Math.min(w / size.x, h / size.y, d / size.z) * model.scale;
    object.traverse((node) => {
      node.castShadow = true;
      node.receiveShadow = true;
    });
    return {
      object,
      factor,
      center: box.getCenter(new Vector3()),
      bottom: box.min.y,
      height: size.y * factor,
      footprint: [size.x * factor, size.z * factor] as [number, number],
    };
  }, [scene, model.rotation, model.scale, w, h, d]);
  return (
    <group
      position={[
        (model.offset_x ?? 0) * w,
        (model.offset_y ?? 0) * h,
        (model.offset_z ?? 0) * d,
      ]}
    >
      <group scale={factor}>
        <group position={[-center.x, -bottom, -center.z]}>
          <primitive object={object} />
        </group>
      </group>
      {children?.(height * model.surface, footprint)}
    </group>
  );
}
export function ImportedModel({
  fallback,
  onError,
  ...props
}: {
  model: VisualModel;
  dimensions: [number, number, number];
  fallback: ReactNode;
  onError?: () => void;
  children?: (surfaceHeight: number, footprint: [number, number]) => ReactNode;
}) {
  return (
    <ModelBoundary key={props.model.url} fallback={fallback} onError={onError}>
      <Suspense fallback={fallback}>
        <LoadedModel {...props} />
      </Suspense>
    </ModelBoundary>
  );
}
