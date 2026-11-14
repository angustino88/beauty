import { type ReactNode } from 'react';
import { Spin } from 'antd';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/store';

interface PrivateRouteProps {
  children: ReactNode;
}

/** Redirects to /login if the user is not authenticated. */
export default function PrivateRoute({ children }: PrivateRouteProps) {
  const RETURN_TO_KEY = 'lm:returnTo';
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const bootstrapStatus = useAppSelector((state) => state.auth.bootstrapStatus);
  const location = useLocation();

  if (bootstrapStatus === 'loading') {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isLoggedIn) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    if (returnTo && returnTo !== '/login') {
      sessionStorage.setItem(RETURN_TO_KEY, returnTo);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
