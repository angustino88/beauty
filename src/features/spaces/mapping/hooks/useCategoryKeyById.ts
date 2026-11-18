import { useMemo } from 'react';
import { useLabsEquipmentReferenceDataRetrieveQuery } from '@/shared/api/generated/api';

/** Equipment category id → stable key, from the (cached) equipment reference data. */
export function useCategoryKeyById(): ReadonlyMap<number, string> {
  const { data } = useLabsEquipmentReferenceDataRetrieveQuery({});
  return useMemo(
    () => new Map((data?.data?.categories ?? []).map((category) => [category.id, category.key ?? ''] as [number, string])),
    [data],
  );
}
