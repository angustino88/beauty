import { lazy } from 'react';

// Each game owns its art, simulation and UI, and exposes a component accepting onClose.
export const games = [
  { id: 'santa-jump', title: 'Santa Jump', Component: lazy(() => import('./santa-jump').then(m => ({ default: m.GameWidget }))) },
];
