import { useState } from 'react';
import {
  useLabsBuildingsOptionsRetrieveQuery,
  useLabsCitiesOptionsRetrieveQuery,
  useLabsCountriesOptionsRetrieveQuery,
  type CatalogOptionListRead,
} from '@/shared/api/generated/api';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { referenceOptions } from '@/features/lab-equipment/shared/hooks/useOwnershipFields';
import type { NamedReference } from '@/shared/utils/resourceReferences';
import type { RoomLocationField, RoomLocationIds } from '../roomFilters';

type CatalogResult = {
  currentData?: CatalogOptionListRead;
  isFetching: boolean;
  isError: boolean;
};

export function useRoomLocationOptions(
  ids: RoomLocationIds,
  enabled = true,
  current?: Partial<Record<RoomLocationField, NamedReference | null>>,
) {
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState({ parent: ids.country, value: '' });
  const [buildingSearch, setBuildingSearch] = useState({ parent: ids.city, value: '' });
  const countryQuery = useDebouncedValue(countrySearch.trim(), 250);
  const cityQuery = useDebouncedValue(citySearch, 250);
  const buildingQuery = useDebouncedValue(buildingSearch, 250);
  const include = (id: number | null) => id == null ? undefined : [id];
  const countries = useLabsCountriesOptionsRetrieveQuery(
    { q: countryQuery || undefined, includeIds: include(ids.country) },
    { skip: !enabled },
  );
  const cities = useLabsCitiesOptionsRetrieveQuery(
    { countryId: ids.country ?? undefined, q: cityQuery.parent === ids.country ? cityQuery.value || undefined : undefined, includeIds: include(ids.city) },
    { skip: !enabled || ids.country == null },
  );
  const buildings = useLabsBuildingsOptionsRetrieveQuery(
    { cityId: ids.city ?? undefined, q: buildingQuery.parent === ids.city ? buildingQuery.value || undefined : undefined, includeIds: include(ids.building) },
    { skip: !enabled || ids.city == null },
  );

  function selector(field: RoomLocationField, result: CatalogResult, onSearch: (value: string) => void, parentHint?: string) {
    const reference = current?.[field];
    return {
      options: referenceOptions(result.currentData?.data, reference?.id === ids[field] ? reference : undefined),
      loading: result.isFetching,
      disabled: Boolean(parentHint),
      searchHint: parentHint ?? (result.isError ? 'Unable to load options. Try searching again.' : 'No matching options.'),
      onSearch,
    };
  }

  return {
    country: selector('country', countries, setCountrySearch),
    city: selector('city', cities, (value) => setCitySearch({ parent: ids.country, value: value.trim() }), ids.country == null ? 'Select a country first' : undefined),
    building: selector('building', buildings, (value) => setBuildingSearch({ parent: ids.city, value: value.trim() }), ids.city == null ? 'Select a city first' : undefined),
  };
}

export type RoomLocationOptions = ReturnType<typeof useRoomLocationOptions>;
