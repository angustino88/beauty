import { type ReactNode } from 'react';
import { Spin } from 'antd';
import { useAppSelector } from '@/app/store';
import { useGetMeQuery } from '@/features/auth/api';
import { holds, type LabsPermission } from '@/features/auth/permissions';
import AccessDenied from '@/pages/errors/AccessDenied';

interface PermissionRouteProps {
  children: ReactNode;
  /** The Labs permission the page needs (`GET /api/users/me` → `effective_permissions`). */
  permission: LabsPermission;
}

export default function PermissionRoute({ children, permission }: PermissionRouteProps) {
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const bootstrapStatus = useAppSelector((state) => state.auth.bootstrapStatus);
  const { isLoading, isFetching, isUninitialized } = useGetMeQuery(undefined, {
    skip: !isLoggedIn || bootstrapStatus !== 'authenticated',
  });
  const hasAccess = useAppSelector((state) => holds(state.me.permissions, permission));

  if (isLoggedIn && (bootstrapStatus === 'loading' || isUninitialized || isLoading || isFetching)) {
    return (
      <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
