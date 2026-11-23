// src/features/dashboard/hooks/useDashboardFavorites.ts
//
// Favourite toggle with optimistic updates.
// The RTK Query mutation patches the local cache immediately via onQueryStarted,
// then rolls back on API failure. No refetch needed — star toggles instantly.
import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import { getApiErrorMessage, notify } from '@/shared/notifications';
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
        notify.error('Unable to update favorite', {
          description:
            status === 404
              ? 'Favorites are not available for this workspace yet.'
              : getApiErrorMessage(err, 'Please try again.'),
        });
      });
    },
    [addFavorite, removeFavorite],
  );

  return { handleFavoriteClick };
}
