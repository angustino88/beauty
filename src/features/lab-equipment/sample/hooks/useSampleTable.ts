import { useMemo } from 'react';
import {
  useGetSampleChannelsQuery,
  useGetSampleCharacteristicsQuery,
  useGetSampleFiltersQuery,
  useGetSampleKLsQuery,
  useGetSampleManufacturersQuery,
  useGetSampleOEMsQuery,
  useGetSampleProductLinesQuery,
  useGetSamplesQuery,
  useGetSampleTypesQuery,
  useGetSampleVersionsQuery,
} from '../api';
import {
  isSummaryConsistent,
  summarizeHardwareRows,
  toEntityFilters,
  useGetEquipmentSummaryQuery,
  useEquipmentTableState,
  useGetUsersQuery,
  useServerEquipmentFilter,
} from '../../shared';
import { EQUIPMENT_FILTER_RULES } from '../../shared/utils/equipmentFilterRules';
import type {
  ISample,
  ISampleChannel,
  ISampleCharacteristic,
  ISampleKL,
  ISampleManufacturer,
  ISampleOEM,
  ISampleProductLine,
  ISampleType,
  ISampleVersion,
} from '../types';
import { facetToAntdFilters, getFacetOptions } from '../../shared/facets/filterFacets';

type SelectOption = { label: string; value: number };

export function useSampleTable() {
  const { search, setSearch, page, setPage, pageSize, setPageSize, filters, setFilters, debouncedSearch } = useEquipmentTableState();

  const listQuery = useGetSamplesQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    ordering: 'id',
  });
  const serverFilter = useServerEquipmentFilter<ISample>({ filters, filterKey: 'Sample', filterRules: EQUIPMENT_FILTER_RULES.Sample ?? { single: [] as string[], multiple: [] as string[] }, page });
  const summaryState = useGetEquipmentSummaryQuery('sample');
  const summaryData = summaryState.data;
  const shouldUseSnapshot = useMemo(
    () => summaryState.isError
      || (summaryData
        ? !isSummaryConsistent(summaryData, ['in_use', 'available', 'borrowed', 'in_storage'])
        : false),
    [summaryState.isError, summaryData],
  );
  const summaryQuery = useGetSamplesQuery(
    { page: 1, page_size: 100, ordering: 'id' },
    { skip: !shouldUseSnapshot },
  );
  const usersQuery = useGetUsersQuery();
  const manufacturerQuery = useGetSampleManufacturersQuery();
  const productLineQuery = useGetSampleProductLinesQuery();
  const versionQuery = useGetSampleVersionsQuery();
  const typeQuery = useGetSampleTypesQuery();
  const oemQuery = useGetSampleOEMsQuery();
  const klQuery = useGetSampleKLsQuery();
  const channelQuery = useGetSampleChannelsQuery();
  const characteristicQuery = useGetSampleCharacteristicsQuery();
  const facetsQuery = useGetSampleFiltersQuery();

  const rows = useMemo(
    () => serverFilter.hasActiveFilters ? serverFilter.data : listQuery.data?.data ?? [],
    [listQuery.data?.data, serverFilter.data, serverFilter.hasActiveFilters],
  );
  const summaryRows = useMemo(
    () => summaryQuery.data?.data ?? [],
    [summaryQuery.data?.data],
  );

  const summaryOverride = useMemo(
    () => (shouldUseSnapshot
      ? summarizeHardwareRows(summaryRows, Number(summaryQuery.data?.total_count ?? 0))
      : undefined),
    [shouldUseSnapshot, summaryRows, summaryQuery.data?.total_count],
  );

  const typeOptions = useMemo<SelectOption[]>(
    () => (typeQuery.data ?? []).map((item) => ({
      label: item.sample_type_name ?? item.name ?? '',
      value: item.id,
    })),
    [typeQuery.data],
  );
  const manufacturerOptions = useMemo<SelectOption[]>(
    () => (manufacturerQuery.data ?? []).map((item) => ({
      label: item.manufacturer_name ?? item.sample_manufacturer_name ?? item.name ?? '',
      value: item.id,
    })),
    [manufacturerQuery.data],
  );
  const productLineOptions = useMemo<SelectOption[]>(
    () => (productLineQuery.data ?? []).map((item) => ({
      label: item.sample_product_line_name ?? item.name ?? '',
      value: item.id,
    })),
    [productLineQuery.data],
  );
  const versionOptions = useMemo<SelectOption[]>(
    () => (versionQuery.data ?? []).map((item) => ({
      label: item.sample_version_name ?? item.name ?? '',
      value: item.id,
    })),
    [versionQuery.data],
  );
  const oemOptions = useMemo<SelectOption[]>(
    () => (oemQuery.data ?? []).map((item) => ({
      label: item.sample_OEM_name ?? item.name ?? '',
      value: item.id,
    })),
    [oemQuery.data],
  );
  const klOptions = useMemo<SelectOption[]>(
    () => (klQuery.data ?? []).map((item) => ({
      label: item.sample_KL_name ?? item.name ?? '',
      value: item.id,
    })),
    [klQuery.data],
  );
  const channelOptions = useMemo<SelectOption[]>(
    () => (channelQuery.data ?? []).map((item) => ({
      label: item.sample_communication_channel_name ?? item.name ?? '',
      value: item.id,
    })),
    [channelQuery.data],
  );
  const characteristicOptions = useMemo<SelectOption[]>(
    () => (characteristicQuery.data ?? []).map((item) => ({
      label: item.sample_characteristic_name ?? item.name ?? String(item.id),
      value: item.id,
    })),
    [characteristicQuery.data],
  );
  const ownerOptions = useMemo(
    () => (usersQuery.data ?? []).map((user) => ({
      label: user.username || user.display_name || String(user.id),
      value: user.id,
    })),
    [usersQuery.data],
  );

  const typeFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'sample_type', 'type'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ISampleType>(typeQuery.data, (item) => item.sample_type_name ?? item.name),
    [facetsQuery.data, typeQuery.data],
  );
  const manufacturerFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'manufacturer', 'sample_manufacturer'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ISampleManufacturer>(manufacturerQuery.data, (item) => item.manufacturer_name ?? item.sample_manufacturer_name ?? item.name),
    [facetsQuery.data, manufacturerQuery.data],
  );
  const productLineFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'product_line', 'sample_product_line'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ISampleProductLine>(productLineQuery.data, (item) => item.sample_product_line_name ?? item.name),
    [facetsQuery.data, productLineQuery.data],
  );
  const versionFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'version', 'sample_version'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ISampleVersion>(versionQuery.data, (item) => item.sample_version_name ?? item.name),
    [facetsQuery.data, versionQuery.data],
  );
  const oemFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'oem', 'sample_OEM'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ISampleOEM>(oemQuery.data, (item) => item.sample_OEM_name ?? item.name),
    [facetsQuery.data, oemQuery.data],
  );
  const klFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'kl', 'sample_KL'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ISampleKL>(klQuery.data, (item) => item.sample_KL_name ?? item.name),
    [facetsQuery.data, klQuery.data],
  );
  const channelFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'communication_channel', 'sample_communication_channel'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ISampleChannel>(channelQuery.data, (item) => item.sample_communication_channel_name ?? item.name),
    [facetsQuery.data, channelQuery.data],
  );
  const characteristicFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'sample_characteristic', 'characteristic'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ISampleCharacteristic>(characteristicQuery.data, (item) => item.sample_characteristic_name ?? item.name),
    [facetsQuery.data, characteristicQuery.data],
  );
  const ownerFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'primary_owner', 'owner', 'owner_id'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? [],
    [facetsQuery.data],
  );
  const statusFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'status', 'status_type'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? [],
    [facetsQuery.data],
  );

  return {
    search,
    setSearch,
    page,
    pageSize,
    setPage,
    setPageSize,
    filters,
    setFilters,
    rows,
    totalRecords: serverFilter.hasActiveFilters ? serverFilter.totalCount : listQuery.data?.total_count ?? 0,
    isFetching: serverFilter.isFetching || listQuery.isFetching,
    refetch: serverFilter.hasActiveFilters ? serverFilter.refetch : listQuery.refetch,
    summaryOverride,
    typeFilters,
    manufacturerFilters,
    productLineFilters,
    versionFilters,
    oemFilters,
    klFilters,
    channelFilters,
    characteristicFilters,
    ownerFilters,
    statusFilters,
    typeOptions,
    manufacturerOptions,
    productLineOptions,
    versionOptions,
    oemOptions,
    klOptions,
    channelOptions,
    characteristicOptions,
    ownerOptions,
  };
}
