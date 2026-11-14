import { type ReactNode } from 'react';
import { Spin } from 'antd';
import { useAppSelector } from '@/app/store';
import { useGetMeQuery } from '@/features/auth/api';
import AccessDenied from '@/pages/errors/AccessDenied';

interface PermissionRouteProps {
  children: ReactNode;
  /** One or more group names — user must belong to at least one */
  groups: string[];
}

export default function PermissionRoute({ children, groups }: PermissionRouteProps) {
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const bootstrapStatus = useAppSelector((state) => state.auth.bootstrapStatus);
  const { isLoading, isFetching, isUninitialized } = useGetMeQuery(undefined, {
    skip: !isLoggedIn || bootstrapStatus !== 'authenticated',
  });
  const permissionGroups = useAppSelector((state) => state.me.permissionGroups);
  const hasAccess = groups.some((g) => {
    if (permissionGroups[g]) return true;
    const slug = g.toLowerCase().replace(/[\s_]+/g, '-');
    return Boolean(permissionGroups[slug]);
  });

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
