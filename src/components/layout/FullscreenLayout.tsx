import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { FullscreenLoading } from './FullscreenLoading';
import { OfflineNotification } from './OfflineNotification';

/** Full-viewport layout used for immersive pages (e.g. 3D dashboard). No sidebar/header. */
export function FullscreenLayout() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <OfflineNotification />
      <Suspense fallback={<FullscreenLoading />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
