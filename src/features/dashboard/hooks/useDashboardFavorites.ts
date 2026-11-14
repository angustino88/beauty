// src/features/dashboard/hooks/useDashboardFavorites.ts
//
// Favourite toggle with optimistic updates.
// The RTK Query mutation patches the local cache immediately via onQueryStarted,
// then rolls back on API failure. No refetch needed — star toggles instantly.
import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import { notification } from 'antd';
import { useAddFavoriteMutation, useRemoveFavoriteMutation } from '../api';

export interface DashboardFavoritesResult {
handleFavoriteClick: (labId: number, isFavorite: boolean, e: MouseEvent) => void;
}

export function useDashboardFavorites(): DashboardFavoritesResult {
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  const handleFavoriteClick = useCallback(
    (labId: number, isFavorite: boolean, e: MouseEvent) => {
      e.stopPropagation();
      const arg = { labId };
      const mutation = isFavorite ? removeFavorite(arg) : addFavorite(arg);
      mutation.unwrap().catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        notification.error({
          message: 'Failed to update favourite',
          description: status === 404 ? 'Feature not available yet.' : 'Please try again.',
          duration: 3,
        });
      });
    },
    [addFavorite, removeFavorite],
  );

  return { handleFavoriteClick };
}
