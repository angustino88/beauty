import { lazy, Suspense } from 'react';

// The seasonal mascots are ~1 MB of SVG path data each. Load them on demand so they stay out of the
// main bundle; they render only during their season or inside the (already lazy) game widget.
const LionDance = lazy(() => import('./LionDanceIcon').then((m) => ({ default: m.LionDanceIcon })));
const SantaReindeer = lazy(() => import('./SantaReindeerIcon').then((m) => ({ default: m.SantaReindeerIcon })));

export const LazyLionDanceIcon = () => (
  <Suspense fallback={null}>
    <LionDance />
  </Suspense>
);

export const LazySantaReindeerIcon = () => (
  <Suspense fallback={null}>
    <SantaReindeer />
  </Suspense>
);
