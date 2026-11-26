import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppDispatch } from '@/app/store';
import { useGetMeQuery } from '@/features/auth/api';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { meActions, meFromUser } from '@/features/auth/meSlice';
import { resolveUserDisplayName } from '@/features/auth/utils/displayName';
import { FullscreenLoading } from './FullscreenLoading';
import { OfflineNotification } from './OfflineNotification';

/** Full-viewport layout used for immersive pages (e.g. 3D dashboard). No sidebar/header. */
export function FullscreenLayout() {
  // Load the signed-in user's permissions here too, so operator controls work when the page is opened directly.
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAuthState();
  const { data: meData } = useGetMeQuery(undefined, { skip: !isLoggedIn });
  useEffect(() => {
    if (!meData) return;
    const user = meData.data;
    dispatch(
      meActions.setMe({
        ...meFromUser(user),
        displayName: resolveUserDisplayName(user.display_name, user.username),
      }),
    );
  }, [meData, dispatch]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <OfflineNotification />
      <Suspense fallback={<FullscreenLoading />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
