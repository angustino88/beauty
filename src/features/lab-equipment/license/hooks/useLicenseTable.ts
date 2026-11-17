import { mapLicenseRead } from '../mapper';
import { useMemo } from 'react';
import {
  useGetLicenseCategoriesQuery,
  useGetLicenseFiltersQuery,
  useGetLicenseProductsQuery,
  useGetLicenseRestrictionsQuery,
  useGetLicenseStatusSummaryQuery,
  useGetLicensesQuery,
  useGetLicenseTypesQuery,
  useGetLicenseVendorsQuery,
} from '../api';
import {
  toEntityFilters,
  useEquipmentTableState,
  useGetUsersQuery,
  useServerEquipmentFilter,
} from '../../shared';
import { EQUIPMENT_FILTER_RULES } from '../../shared/utils/equipmentFilterRules';
import type {
  ILicense,
  ILicenseCategory,
  ILicenseProduct,
  ILicenseRestriction,
  ILicenseType,
  ILicenseVendor,
} from '../types';
import { facetToAntdFilters, getFacetOptions } from '../../shared/facets/filterFacets';
import { toUserOption } from '@/shared/utils/userOption';

type SelectOption = { label: string; value: number };
export function useLicenseTable() {
  const { search, setSearch, page, setPage, pageSize, setPageSize, filters, setFilters, debouncedSearch } = useEquipmentTableState();

  const listQuery = useGetLicensesQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    ordering: 'id',
  });
  const serverFilter = useServerEquipmentFilter<ILicense>({ filters, filterKey: 'License', filterRules: EQUIPMENT_FILTER_RULES.License ?? { single: [] as string[], multiple: [] as string[] }, page, mapItem: mapLicenseRead });
  const summaryState = useGetLicenseStatusSummaryQuery();
  const usersQuery = useGetUsersQuery();
  const productQuery = useGetLicenseProductsQuery();
  const vendorQuery = useGetLicenseVendorsQuery();
  const typeQuery = useGetLicenseTypesQuery();
  const categoryQuery = useGetLicenseCategoriesQuery();
  const restrictionQuery = useGetLicenseRestrictionsQuery();
  const facetsQuery = useGetLicenseFiltersQuery();

  const rows = useMemo(
    () => serverFilter.hasActiveFilters ? serverFilter.data : listQuery.data?.data ?? [],
    [listQuery.data?.data, serverFilter.data, serverFilter.hasActiveFilters],
  );
  const productOptions = useMemo<SelectOption[]>(
    () => (productQuery.data ?? []).map((item) => ({
      label: item.product_name || '',
      value: item.id,
    })),
    [productQuery.data],
  );
  const vendorOptions = useMemo<SelectOption[]>(
    () => (vendorQuery.data ?? []).map((item) => ({
      label: item.vendor_name || '',
      value: item.id,
    })),
    [vendorQuery.data],
  );
  const typeOptions = useMemo<SelectOption[]>(
    () => (typeQuery.data ?? []).map((item) => ({
      label: item.type_name ?? item.license_type_name ?? '',
      value: item.id,
    })),
    [typeQuery.data],
  );
  const categoryOptions = useMemo<SelectOption[]>(
    () => (categoryQuery.data ?? []).map((item) => ({
      label: item.category_name || '',
      value: item.id,
    })),
    [categoryQuery.data],
  );
  const restrictionOptions = useMemo<SelectOption[]>(
    () => (restrictionQuery.data ?? []).map((item) => ({
      label: item.restriction_name ?? item.license_restriction_name ?? '',
      value: item.id,
    })),
    [restrictionQuery.data],
  );
  const ownerOptions = useMemo(
    () => (usersQuery.data ?? []).map(toUserOption),
    [usersQuery.data],
  );
  const productFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'license_product', 'product'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ILicenseProduct>(productQuery.data, (item) => item.product_name),
    [facetsQuery.data, productQuery.data],
  );
  const vendorFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'license_vendor', 'vendor'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ILicenseVendor>(vendorQuery.data, (item) => item.vendor_name),
    [facetsQuery.data, vendorQuery.data],
  );
  const categoryFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'license_category', 'category'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ILicenseCategory>(categoryQuery.data, (item) => item.category_name),
    [facetsQuery.data, categoryQuery.data],
  );
  const typeFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'license_type', 'type'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ILicenseType>(typeQuery.data, (item) => item.type_name ?? item.license_type_name),
    [facetsQuery.data, typeQuery.data],
  );
  const restrictionFilters = useMemo(
    () => facetToAntdFilters(getFacetOptions(facetsQuery.data, 'license_restriction', 'restriction'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? toEntityFilters<ILicenseRestriction>(restrictionQuery.data, (item) => item.restriction_name ?? item.license_restriction_name),
    [facetsQuery.data, restrictionQuery.data],
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
    statusSummary: summaryState.data,
    statusSummaryLoading: summaryState.isLoading,
    statusSummaryError: summaryState.isError,
    refetchStatusSummary: summaryState.refetch,
    productFilters,
    vendorFilters,
    categoryFilters,
    typeFilters,
    restrictionFilters,
    ownerFilters,
    statusFilters,
    productOptions,
    vendorOptions,
    typeOptions,
    categoryOptions,
    restrictionOptions,
    ownerOptions,
  };
}
