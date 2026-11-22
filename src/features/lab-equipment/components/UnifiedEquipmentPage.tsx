import { useUrlSearch } from '@/shared/hooks/useUrlSearch';
import { SpaceLocationRow } from '@/features/spaces/shared/components/SpaceLocation';
import React, { useState, useMemo, useCallback, type Key } from 'react';
import { WorkbookImportButton } from '@/features/data-import';
import { Tag, Tooltip, Popover, Progress, Modal, Form, Select, Input, InputNumber, Button } from 'antd';
import { getApiErrorMessage, notify } from '@/shared/notifications';
import type { ColumnsType } from 'antd/es/table';
import { CloudServerOutlined, DesktopOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { EquipmentCategoryConfig } from '../categories/registry';
import type {
  EquipmentItem,
  EquipmentListParams,
  EquipmentWritePayload,
} from '../types/equipment';
import {
  useGetEquipmentListQuery,
  useGetEquipmentSummaryQuery,
  useGetEquipmentFiltersQuery,
  useGetEquipmentFacetQuery,
  useGetEquipmentCatalogOptionsQuery,
  useGetEquipmentDetailQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
  useChangeEquipmentConditionMutation,
  useChangeEquipmentLifecycleMutation,
  useUpdateEquipmentImageMutation,
  useDeleteEquipmentImageMutation,
} from '../api/equipmentApi';
import { useLabsDepartmentsOptionsRetrieveQuery, useLabsGroupsOptionsRetrieveQuery, useLabsRoomsOptionsRetrieveQuery, useLabsStationsOptionsRetrieveQuery, useLabsBenchesOptionsRetrieveQuery, useLabsEquipmentReferenceDataRetrieveQuery, useLabsEquipmentCategoriesRetrieveByCategoryIdQuery, useLabsEquipmentPlacementUpdateByEquipmentIdMutation, useLabsEquipmentPlacementDestroyByEquipmentIdMutation, useLabsEquipmentActionsHandOverCreateByEquipmentIdMutation, useLabsEquipmentActionsReturnCreateByEquipmentIdMutation } from '@/shared/api/generated/api';
import { useLabsEquipmentStatusChangesRetrieveByEquipmentIdQuery } from '@/shared/api/generated/api';
import type { EquipmentPlacementWrite } from '@/shared/api/generated/api';
import { skipToken } from '@reduxjs/toolkit/query';
import EquipmentPageLayout from '../shared/components/layout/EquipmentPageLayout';
import EquipmentInventoryOverview from '../shared/components/cards/EquipmentInventoryOverview';
import tableStyles from '../shared/components/layout/InventoryPresentation.module.css';
import EquipmentStatusHistoryModal from '../shared/components/modals/EquipmentStatusHistoryModal';
import EquipmentFormModal, {
  type FieldConfig,
} from '../shared/components/modals/EquipmentFormModal';
import EquipmentStatus, { UpdateEquipmentStatusModal, type EquipmentStatusAction } from '../shared/components/status/EquipmentStatus';
import {
  createActionsRenderer,
  renderImageCell,
  renderOwnerCell,
} from '../shared/columns/sharedColumns';
import { resourcePageIcon } from '@/components/layout/pageIcons';
import type { IPrimaryOwner } from '../shared/types/equipment.types';
import { facetToAntdFilters, getFacetOptions } from '../shared/facets/filterFacets';
import { buildEquipmentFacetParams, resetDependentFilters, selectedFilterCsv } from '../shared/facets/equipmentFacetParams';
import { equipmentFacetColumnFilter, equipmentStaticColumnFilter } from '../shared/facets/EquipmentFacetDropdown';
import {
  EQUIPMENT_STATUS_FILTER_OPTIONS,
  sortRowsByIdAsc,
} from '../shared/utils/parity';
import { printDeviceLabel } from '../shared/utils/printLabel';
import { buildEquipmentFormFields, equipmentFormInitialValues } from '../shared/utils/formFields';
import { notifyEquipmentCreated, notifyEquipmentDeleted, notifyEquipmentError, notifyEquipmentUpdated } from '../shared/utils/equipmentNotifications';
import { equipmentStatusTone } from '../shared/utils/equipmentStatus';
import { userLabel } from '@/shared/utils/userRef';
import { AgentHealthCell, ComputingAgentDialog, liveAgentsByEquipment, useGetComputingAgentsQuery, type AgentComputer } from '../agents';
import MonitoredDevicesPopover from './MonitoredDevicesPopover';
import { usePermission } from '@/features/auth/hooks/useCan';

export interface UnifiedEquipmentPageProps {
  config: EquipmentCategoryConfig;
}


const toSelectOptions = (items?: Array<{ id: number; name: string }>) =>
  items?.map(({ id, name }) => ({ label: name, value: id })) ?? [];

/** Shared equipment category controller; default export is the route entry point. */
export const UnifiedEquipmentPage: React.FC<UnifiedEquipmentPageProps> = ({ config }) => {
  const canManageLabOperations = usePermission('lab_operations.manage');

  // Table state: pagination, search, column filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Seeded from ?q= so links from mapping, placement and the graph open the list filtered.
  const [search, setSearch] = useUrlSearch();
  const [filters, setFilters] = useState<Record<string, Key[] | null>>({});

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusItem, setStatusItem] = useState<EquipmentItem | null>(null);

  const [historyId, setHistoryId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [placementItem, setPlacementItem] = useState<EquipmentItem | null>(null);
  const [placementForm] = Form.useForm<EquipmentPlacementWrite & { target: 'room' | 'station' | 'bench' | 'note'; target_id?: number }>();
  const placementTarget = Form.useWatch('target', placementForm);
  const [placementSearch, setPlacementSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [statusLocationSearch, setStatusLocationSearch] = useState('');

  // Reference data
  const { data: facets } = useGetEquipmentFiltersQuery(config.key);
  const { data: allReferenceData } = useLabsEquipmentReferenceDataRetrieveQuery({});
  const categoryId = allReferenceData?.data.categories.find((option) => option.key === config.key)?.id;
  const { data: categoryDetail } = useLabsEquipmentCategoriesRetrieveByCategoryIdQuery(categoryId ? { categoryId } : skipToken, { skip: !statusModalOpen });
  const { data: categoryReferenceData } = useLabsEquipmentReferenceDataRetrieveQuery(categoryId ? { category: categoryId } : skipToken);
  const refData = categoryReferenceData?.data ?? allReferenceData?.data;
  const { data: categorySummary, isLoading: summaryLoading } = useGetEquipmentSummaryQuery(categoryId ?? 0, { skip: !categoryId });
  const { data: departmentOptions } = useLabsDepartmentsOptionsRetrieveQuery({ q: departmentSearch || undefined, includeIds: typeof editingItem?.department?.id === 'number' ? [editingItem.department.id] : undefined }, { skip: !formOpen });
  const departmentId = Number(formValues.department_id) || undefined;
  const groupIncludeIds = formMode === 'edit' && editingItem?.group?.id != null && Number(editingItem.department?.id) === departmentId
    ? [editingItem.group.id]
    : undefined;
  const { data: groupOptions } = useLabsGroupsOptionsRetrieveQuery({ departmentId, q: groupSearch || undefined, includeIds: groupIncludeIds }, { skip: !formOpen || !departmentId });
  const placementIncludeIds = placementItem?.placement && placementItem.placement.target_type.value === placementTarget
    ? [placementTarget === 'bench' ? placementItem.placement.bench?.id
      : placementTarget === 'station' ? placementItem.placement.station?.id
        : placementTarget === 'room' ? placementItem.placement.room?.id : undefined]
      .filter((id): id is number => typeof id === 'number')
    : undefined;
  const placementArgs = { q: placementSearch || undefined, includeIds: placementIncludeIds };
  const { data: roomOptions, isFetching: loadingRooms } = useLabsRoomsOptionsRetrieveQuery(placementArgs, { skip: !placementItem || placementTarget !== 'room' });
  const statusLocationArgs = { q: statusLocationSearch || undefined };
  const { data: stationOptions, isFetching: loadingStations } = useLabsStationsOptionsRetrieveQuery(placementArgs, { skip: !placementItem || placementTarget !== 'station' });
  const { data: statusRoomOptions, isFetching: loadingStatusRooms } = useLabsRoomsOptionsRetrieveQuery(statusLocationArgs, { skip: !statusModalOpen });
  const { data: statusStationOptions, isFetching: loadingStatusStations } = useLabsStationsOptionsRetrieveQuery(statusLocationArgs, { skip: !statusModalOpen });
  const { data: benchOptions, isFetching: loadingBenches } = useLabsBenchesOptionsRetrieveQuery(statusModalOpen ? statusLocationArgs : placementArgs, { skip: (!placementItem && !statusModalOpen) || (!statusModalOpen && placementTarget !== 'bench') });
  const placementOptions = placementTarget === 'room' ? roomOptions?.data : placementTarget === 'station' ? stationOptions?.data : benchOptions?.data;
  const normalizedFilters = useMemo(() => Object.fromEntries(
    Object.entries(filters).map(([key, values]) => [key, values?.map((value) => String(value)) ?? null]),
  ), [filters]);
  const tableFacetArgs = (dimension: 'kind' | 'type' | 'manufacturer' | 'product_model_id' | 'department_id' | 'group_id') => ({
    categoryPath: config.key,
    ...buildEquipmentFacetParams(dimension, categoryId, normalizedFilters, search),
  });
  const kindFacetQuery = useGetEquipmentFacetQuery(tableFacetArgs('kind'), { skip: !categoryId });
  const typeFacetQuery = useGetEquipmentFacetQuery(tableFacetArgs('type'), { skip: !categoryId });
  const manufacturerFacetQuery = useGetEquipmentFacetQuery(tableFacetArgs('manufacturer'), { skip: !categoryId });
  const modelFacetQuery = useGetEquipmentFacetQuery(tableFacetArgs('product_model_id'), { skip: !categoryId });
  const departmentFacetQuery = useGetEquipmentFacetQuery(tableFacetArgs('department_id'), { skip: !categoryId });
  const groupFacetQuery = useGetEquipmentFacetQuery(tableFacetArgs('group_id'), { skip: !categoryId });
  const kindId = Number(formValues.kind_id) || undefined;
  const typeId = Number(formValues.type_id) || undefined;
  const manufacturerId = Number(formValues.manufacturer_id) || undefined;
  const kindOptionsQuery = useGetEquipmentCatalogOptionsQuery({
    endpoint: 'kinds', categoryId,
    includeIds: Number(formValues.kind_id) ? [Number(formValues.kind_id)] : undefined,
  }, { skip: !formOpen || !categoryId });
  const typeOptionsQuery = useGetEquipmentCatalogOptionsQuery({
    endpoint: 'types', categoryId, kindId,
    includeIds: Number(formValues.type_id) ? [Number(formValues.type_id)] : undefined,
  }, { skip: !formOpen || !categoryId || !kindId });
  const manufacturerOptionsQuery = useGetEquipmentCatalogOptionsQuery({
    endpoint: 'manufacturers', categoryId,
    includeIds: Number(formValues.manufacturer_id) ? [Number(formValues.manufacturer_id)] : undefined,
  }, { skip: !formOpen || !categoryId });
  const modelOptionsQuery = useGetEquipmentCatalogOptionsQuery({
    endpoint: 'product-models', typeId, manufacturerId,
    includeIds: Number(formValues.product_model_id) ? [Number(formValues.product_model_id)] : undefined,
  }, { skip: !formOpen || (!typeId && !manufacturerId) });
  const kindFormOptions = useMemo(() => toSelectOptions(kindOptionsQuery.currentData?.data), [kindOptionsQuery.currentData]);
  const typeFormOptions = useMemo(() => toSelectOptions(typeOptionsQuery.currentData?.data), [typeOptionsQuery.currentData]);
  const manufacturerFormOptions = useMemo(() => toSelectOptions(manufacturerOptionsQuery.currentData?.data), [manufacturerOptionsQuery.currentData]);
  const modelFormOptions = useMemo(() => toSelectOptions(modelOptionsQuery.currentData?.data), [modelOptionsQuery.currentData]);

  // Build query parameters from filters & search
  const listParams = useMemo<EquipmentListParams>(() => {
    const params: EquipmentListParams = {
      category: categoryId ?? 0,
      search: search.trim() || undefined,
    };

    params.kind = selectedFilterCsv(normalizedFilters.kind);
    params.type = selectedFilterCsv(normalizedFilters.type);
    params.manufacturer = selectedFilterCsv(normalizedFilters.manufacturer);
    params.product_model = selectedFilterCsv(normalizedFilters.product_model);
    params.status = selectedFilterCsv(normalizedFilters.status);
    params.owner = selectedFilterCsv(normalizedFilters.owner);
    params.department_id = selectedFilterCsv(normalizedFilters.department);
    params.group_id = selectedFilterCsv(normalizedFilters.group_id);

    return params;
  }, [categoryId, search, normalizedFilters]);

  // The contract documents pagination in the response, but does not yet
  // specify request page parameters. Do not assume the backend honors them.
  // Main list query
  const {
    data: listData,
    isLoading: isListLoading,
    isFetching: isListFetching,
    refetch: refetchList,
  } = useGetEquipmentListQuery(listParams, { skip: !categoryId });

  // Sorted rows
  const rows = useMemo(() => sortRowsByIdAsc(listData?.data ?? []), [listData?.data]);

  // Agents of the computers on the visible page: one bounded request, refreshed every minute.
  const [agentComputer, setAgentComputer] = useState<AgentComputer | null>(null);
  const visibleEquipmentIds = useMemo(
    () => (config.supportsAgent ? rows.slice((page - 1) * pageSize, page * pageSize).map((row) => row.id).slice(0, 100) : []),
    [config.supportsAgent, rows, page, pageSize],
  );
  const { data: agentsData, isFetching: agentsLoading } = useGetComputingAgentsQuery(
    { equipmentIds: visibleEquipmentIds, liveOnly: true },
    { skip: visibleEquipmentIds.length === 0, pollingInterval: 60000, skipPollingIfUnfocused: true },
  );
  const agentsByEquipment = useMemo(() => liveAgentsByEquipment(agentsData?.data ?? []), [agentsData]);
  const openAgent = useCallback((record: EquipmentItem) => {
    setAgentComputer({ id: record.id, uid: record.uid, name: record.name, sku: record.sku });
  }, []);

  // Equipment status history is separate from resource-audit history.
  const [updatePlacement, { isLoading: updatingPlacement }] = useLabsEquipmentPlacementUpdateByEquipmentIdMutation();
  const [clearPlacement, { isLoading: clearingPlacement }] = useLabsEquipmentPlacementDestroyByEquipmentIdMutation();
  const [handOverEquipment] = useLabsEquipmentActionsHandOverCreateByEquipmentIdMutation();
  const [returnEquipment] = useLabsEquipmentActionsReturnCreateByEquipmentIdMutation();
  const { data: freshStatusRecord, refetch: refetchStatusRecord } = useGetEquipmentDetailQuery(
    statusItem && categoryId ? { category: config.key, id: statusItem.id } : skipToken,
  );
  const { data: statusHistoryData, isFetching: isStatusHistoryLoading } = useLabsEquipmentStatusChangesRetrieveByEquipmentIdQuery(
    historyId === null ? skipToken : { equipmentId: historyId, page: historyPage, pageSize: historyPageSize },
  );

  // Mutations
  const [createEquipment, { isLoading: isCreating }] = useCreateEquipmentMutation();
  const [updateEquipmentImage] = useUpdateEquipmentImageMutation();
  const [deleteEquipmentImage] = useDeleteEquipmentImageMutation();
  const [updateEquipment, { isLoading: isUpdating }] = useUpdateEquipmentMutation();
  const [deleteEquipment, { isLoading: isDeleting }] = useDeleteEquipmentMutation();
  const [changeCondition] = useChangeEquipmentConditionMutation();
  const [changeLifecycle] = useChangeEquipmentLifecycleMutation();

  // Handlers
  const handleOpenCreate = useCallback(() => {
    setFormMode('create');
    setEditingItem(null);
    setFormValues({});
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (id: number) => {
      const found = listData?.data?.find((item) => item.id === id);
      if (found) {
        setFormMode('edit');
        setEditingItem(found);
        setFormValues({
          kind_id: found.kind?.id,
          type_id: found.type?.id,
          manufacturer_id: found.manufacturer?.id,
          product_model_id: found.product_model?.id,
        });
        setFormOpen(true);
      }
    },
    [listData?.data],
  );

  const handleOpenStatus = useCallback((record: EquipmentItem) => {
    setStatusItem(record);
    setStatusModalOpen(true);
  }, []);

  const refreshStatusDetail = useCallback(async () => {
    const result = await refetchStatusRecord();
    if ('error' in result) throw result.error;
    return result.data;
  }, [refetchStatusRecord]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteEquipment({ category: config.key, id }).unwrap();
        const deletedItem = listData?.data?.find((item) => item.id === id);
        notifyEquipmentDeleted(config.singular, deletedItem ?? { id });
      } catch (err) {
        notifyEquipmentError('delete', config.singular, err);
      }
    },
    [config.key, config.singular, deleteEquipment, listData],
  );

  const handleStatusSave = useCallback(
    async (values: EquipmentStatusAction) => {
      if (!statusItem) return;
      const refreshAfterStep = async () => {
        await refreshStatusDetail();
        await refetchList();
      };
      if (values.action === 'condition') {
        await changeCondition({ category: config.key, id: statusItem.id, body: values.body }).unwrap();
        await refreshAfterStep();
      } else if (values.action === 'lifecycle') {
        await changeLifecycle({ category: config.key, id: statusItem.id, body: values.body }).unwrap();
        await refreshAfterStep();
      } else if (values.action === 'placement') {
        await updatePlacement({ equipmentId: statusItem.id, equipmentPlacementWrite: values.body }).unwrap();
        await refreshAfterStep();
      } else if (values.action === 'clear-placement') {
        await clearPlacement({ equipmentId: statusItem.id }).unwrap();
        await refreshAfterStep();
      } else if (values.action === 'hand-over') {
        await handOverEquipment({ equipmentId: statusItem.id, equipmentHandOver: values.body }).unwrap();
        await refreshAfterStep();
      } else if (values.action === 'return') {
        await returnEquipment({ equipmentId: statusItem.id, equipmentReturn: values.body }).unwrap();
        await refreshAfterStep();
      }
      // The modal may call this handler multiple times for one multi-step action.
      setStatusModalOpen(false);
    },
    [changeCondition, changeLifecycle, clearPlacement, config.key, handOverEquipment, refetchList, refreshStatusDetail, returnEquipment, statusItem, updatePlacement],
  );

  const handleFormSubmit = useCallback(
    async (values: Record<string, unknown>, imageFile?: File | null) => {
        const payload: Record<string, unknown> = { ...values };

        if (typeof payload.dimensions === 'string' && payload.dimensions.trim()) {
          try {
            const parsed: unknown = JSON.parse(payload.dimensions);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !['length_mm', 'width_mm', 'height_mm'].every((key) => typeof (parsed as Record<string, unknown>)[key] === 'number')) {
              throw new Error('Dimensions must contain numeric length_mm, width_mm, and height_mm values.');
            }
            payload.dimensions = parsed;
          } catch (error) {
            notify.warning('Invalid dimensions format', {
              description:
                error instanceof SyntaxError
                  ? 'Enter valid JSON with numeric length_mm, width_mm, and height_mm fields.'
                  : (error as Error).message,
            });
            return;
          }
        }

        for (const field of config.extraFields ?? []) {
          if (field.type === 'select' && (payload[field.name] === '' || payload[field.name] == null)) delete payload[field.name];
          if (field.type === 'multi-select') {
            if (!Array.isArray(payload[field.name])) payload[field.name] = [];
          }
          if (field.type === 'number' && payload[field.name] !== '' && payload[field.name] != null) payload[field.name] = Number(payload[field.name]);
        }

        if (formMode === 'create') {
          const created = await createEquipment({
            category: config.key,
            body: payload as unknown as EquipmentWritePayload,
          }).unwrap();
          if (imageFile && created?.id) await updateEquipmentImage({ id: created.id, image: imageFile }).unwrap();
          notifyEquipmentCreated(config.singular, created ?? {}, payload);
        } else if (editingItem) {
          const updated = await updateEquipment({
            category: config.key,
            id: editingItem.id,
            body: payload as unknown as Partial<EquipmentWritePayload>,
          }).unwrap();
          if (imageFile) await updateEquipmentImage({ id: editingItem.id, image: imageFile }).unwrap();
          else if (imageFile === null) await deleteEquipmentImage(editingItem.id).unwrap();
          notifyEquipmentUpdated(config.singular, updated ?? {}, {
            ...editingItem,
            ...payload,
          });
        }

        setFormOpen(false);
        setEditingItem(null);
    },
    [createEquipment, updateEquipment, updateEquipmentImage, deleteEquipmentImage, config, formMode, editingItem],
  );

  // History modal title
  const historyTitle = useMemo(() => {
    if (historyId === null) return undefined;
    const found = listData?.data?.find((i) => i.id === historyId);
    if (!found) return `${config.singular} #${historyId} Status History`;
    return `${found.sku || ''} | ${found.name || ''}`;
  }, [historyId, listData?.data, config.singular]);

  // Form Fields Configuration matching the shared EquipmentFormModal with complete field parity
  const formFields = useMemo<FieldConfig[]>(() => buildEquipmentFormFields({
    config, formMode, refData, departmentOptions: departmentOptions?.data, groupOptions: groupOptions?.data,
    kindFormOptions, typeFormOptions, manufacturerFormOptions, modelFormOptions,
    onDepartmentSearch: setDepartmentSearch, onGroupSearch: setGroupSearch,
  }), [config, formMode, refData, departmentOptions, groupOptions, kindFormOptions, typeFormOptions, manufacturerFormOptions, modelFormOptions]);

  // Initial values for editing
  const formInitialValues = useMemo(() => equipmentFormInitialValues(editingItem, config), [editingItem, config]);

  // Action button renderer matching the previous UI/UX design
  const actionsRenderer = useMemo(() => {
    return createActionsRenderer<EquipmentItem>({
      canManageLabOperations,
      deleting: isDeleting,
      onEdit: handleOpenEdit,
      onDelete: handleDelete,
      onHistory: (id) => {
        setHistoryPage(1);
        setHistoryPageSize(10);
        setHistoryId(id);
      },
      onPrint: (record) => printDeviceLabel(record),
      extraMenuItems: (record) => [
        ...(config.supportsAgent ? [{
          key: 'agent',
          label: 'Agent',
          icon: <CloudServerOutlined />,
          onClick: () => openAgent(record),
        }] : []),
        {
          key: 'change-placement',
          label: 'Change placement',
          icon: <SwapOutlined />,
          onClick: () => {
            setPlacementSearch('');
            placementForm.resetFields();
            setPlacementItem(record);
            const placement = record.placement;
            placementForm.setFieldsValue({
              target: (placement?.target_type?.value ?? 'note') as 'note' | 'room' | 'station' | 'bench',
              target_id: placement?.bench?.id ?? placement?.station?.id ?? placement?.room?.id,
              location_note: placement?.location_note ?? '',
              role: placement?.role ?? '',
              position: placement?.position ?? undefined,
            });
          },
        },
        {
          key: 'change-state',
          label: 'Change status',
          icon: <SwapOutlined />,
          onClick: () => handleOpenStatus(record),
        },
      ],
    });
  }, [canManageLabOperations, isDeleting, handleOpenEdit, handleDelete, handleOpenStatus, placementForm, setHistoryPage, setHistoryPageSize, setHistoryId, config.supportsAgent, openAgent]);

  // Columns definition matching complete field parity with all equipment fields
  const columns = useMemo<ColumnsType<EquipmentItem>>(() => {
    const cols: ColumnsType<EquipmentItem> = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 64,
        fixed: 'left' as const,
        render: (id: number) => <span className={tableStyles.identifier}>{id}</span>,
      },
      {
        title: 'SKU',
        dataIndex: 'sku',
        key: 'sku',
        width: 120,
        fixed: 'left' as const,
        render: (sku: string) => (
          <span className={tableStyles.identifier}>
            {sku || '—'}
          </span>
        ),
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        render: (name: string) => <Tooltip title={name}><strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</strong></Tooltip>,
      },
      {
        title: 'Image',
        key: 'image',
        width: 90,
        align: 'center' as const,
        render: (_: unknown, record: EquipmentItem) => renderImageCell(record.image, resourcePageIcon(config.key)),
      },
      {
        title: 'Kind',
        key: 'kind',
        width: 140,
        ...equipmentFacetColumnFilter(kindFacetQuery),
        filteredValue: filters.kind ?? null,
        render: (_: unknown, record: EquipmentItem) => record.kind?.name ?? '—',
      },
      {
        title: 'Type',
        key: 'type',
        width: 140,
        ...equipmentFacetColumnFilter(typeFacetQuery),
        filteredValue: filters.type ?? null,
        render: (_: unknown, record: EquipmentItem) => record.type?.name ?? '—',
      },
      {
        title: 'Manufacturer',
        key: 'manufacturer',
        width: 160,
        ...equipmentFacetColumnFilter(manufacturerFacetQuery),
        filteredValue: filters.manufacturer ?? null,
        render: (_: unknown, record: EquipmentItem) => record.manufacturer?.name ?? '—',
      },
      {
        title: 'Model',
        key: 'product_model',
        width: 160,
        ...equipmentFacetColumnFilter(modelFacetQuery),
        filteredValue: filters.product_model ?? null,
        render: (_: unknown, record: EquipmentItem) => record.product_model?.name ?? '—',
      },
      {
        title: 'Department',
        key: 'department',
        width: 160,
        ...equipmentFacetColumnFilter(departmentFacetQuery),
        filteredValue: filters.department ?? null,
        render: (_: unknown, record: EquipmentItem) => record.department?.name ?? '—',
      },
      {
        title: 'Group',
        key: 'group_id',
        width: 140,
        ...equipmentFacetColumnFilter(groupFacetQuery),
        filteredValue: filters.group_id ?? null,
        render: (_: unknown, record: EquipmentItem) => record.group?.name ?? '—',
      },
      {
        title: 'Serial Number',
        dataIndex: 'serial_number',
        key: 'serial_number',
        width: 150,
        render: (val: string) => <Tooltip title={val}><span className={tableStyles.identifier}>{val || '—'}</span></Tooltip>,
      },
    ];

    // Category-specific columns inserted right after core identification & license
    if (config.extraColumns && config.extraColumns.length > 0) {
      for (const extra of config.extraColumns) {
        cols.push({
          title: extra.title,
          dataIndex: extra.dataIndex,
          key: extra.dataIndex,
          width: extra.width ?? 140,
          render: (val: unknown) => (extra.render ? extra.render(val) : String(val ?? '—')),
        });
      }
    }

    if (config.supportsAgent) {
      cols.push({
        title: 'Agent',
        key: 'agent',
        width: 150,
        render: (_: unknown, record: EquipmentItem) => (
          <AgentHealthCell agent={agentsByEquipment.get(record.id)} loading={agentsLoading && !agentsData} onOpen={() => openAgent(record)} />
        ),
      });
    }

    cols.push(
      {
        title: 'Log Label',
        dataIndex: 'log_label',
        key: 'log_label',
        width: 130,
        render: (val: string) => val || '—',
      },
    );

    if (config.supportsTelemetry) {
      cols.push(
      {
        title: 'Disk Usage',
        dataIndex: 'disk_usage',
        key: 'disk_usage',
        width: 260,
        render: (value: EquipmentItem['disk_usage']) => {
          if (!Array.isArray(value) || value.length === 0) return '—';
          return (
            <div style={{ width: '100%', minWidth: 160 }}>
              {value.map((entry) => {
                const total = Number(entry.total || 0);
                const used = Number(entry.used || 0);
                const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                const strokeColor = percent < 75 ? 'var(--lm-success-solid)' : percent > 90 ? 'var(--lm-danger-solid)' : 'var(--lm-warning-solid)';
                return (
                  <div key={entry.name} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span>{entry.name} Drive</span>
                      <span>
                        {Math.max(total - used, 0)}GB Free / {total}GB
                      </span>
                    </div>
                    <Progress percent={percent} showInfo={false} strokeColor={strokeColor} size="small" />
                  </div>
                );
              })}
            </div>
          );
        },
      },
      {
        title: 'System Information',
        dataIndex: 'sys_info',
        key: 'sys_info',
        width: 154,
        align: 'center' as const,
        render: (_value: EquipmentItem['sys_info'], record: EquipmentItem) => {
          const value = record.sys_info ?? record.system_info;
          const entries = Array.isArray(value)
            ? value.map((item) => ({ key: item.item, value: item.value }))
            : typeof value === 'object' && value !== null
              ? Object.entries(value).map(([k, v]) => ({ key: k, value: String(v ?? '') }))
              : [];
          return (
            <Popover
              placement="right"
              trigger="click"
              title="System information"
              content={
                entries.length > 0 ? (
                  <div className={tableStyles.informationContent}>
                    {entries.map((entry) => (
                      <div key={entry.key} style={{ padding: '2px 0' }}>
                        <strong>{entry.key}:</strong>{' '}
                        <span>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'var(--lm-text-tertiary)' }}>No information</span>
                )
              }
            >
              <button type="button" className={tableStyles.informationButton} aria-label="View system information" title="View system information" onClick={(event) => event.stopPropagation()}>
                <DesktopOutlined />
              </button>
            </Popover>
          );
        },
      },
      {
        title: 'Monitored Devices',
        key: 'monitoring',
        width: 150,
        align: 'center' as const,
        render: (_value: unknown, record: EquipmentItem) => <MonitoredDevicesPopover computingId={record.id} computingName={record.name} />,
      },
      );
    }

    cols.push(
      {
        title: 'Acquisition Price',
        dataIndex: 'acquisition_price',
        key: 'acquisition_price',
        width: 150,
        align: 'right' as const,
        render: (val: EquipmentItem['acquisition_price']) => {
          if (val == null || val === '') return '—';
          if (typeof val === 'object') {
            const num = Number(val.amount ?? 0);
            const currency = val.currency || '$';
            return !isNaN(num)
              ? `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : String(val.amount ?? '—');
          }
          const num = Number(val);
          return !isNaN(num)
            ? `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : String(val);
        },
      },
      {
        title: 'Warranty Expiry',
        dataIndex: 'warranty_end_date',
        key: 'warranty_end_date',
        width: 140,
        align: 'center' as const,
        render: (val: string | null | undefined) => {
          if (!val) return '—';
          const d = dayjs(val);
          if (!d.isValid()) return String(val);
          const isExpired = d.isBefore(dayjs(), 'day');
          return (
            <Tag color={isExpired ? 'default' : 'green'}>
              {d.format('YYYY-MM-DD')}
            </Tag>
          );
        },
      },
      {
        title: 'Replacement Date',
        dataIndex: 'replacement_date',
        key: 'replacement_date',
        width: 150,
        align: 'center' as const,
        render: (val: string | null | undefined) => {
          if (!val) return '—';
          const d = dayjs(val);
          return d.isValid() ? d.format('YYYY-[Q]Q') : String(val);
        },
      },
      {
        title: 'Placement',
        key: 'placement',
        width: 190,
        render: (_: unknown, record: EquipmentItem) => {
          const placement = record.placement;
          // Most specific place first, drawn like the space tables' location cells.
          if (placement?.bench) return <SpaceLocationRow kind="bench" primary label={placement.bench.name} refId={placement.bench.id} />;
          if (placement?.station) return <SpaceLocationRow kind="station" primary label={placement.station.name} refId={placement.station.id} />;
          if (placement?.room) return <SpaceLocationRow kind="room" primary label={placement.room.name} refId={placement.room.id} />;
          return placement?.location_note?.trim() || '—';
        },
      },
      {
        title: 'Owner',
        key: 'owner',
        width: 160,
        ...equipmentStaticColumnFilter(facetToAntdFilters(getFacetOptions(facets, 'owner', 'owner_id')) ?? refData?.owners?.map((o) => ({ text: userLabel(o), value: o.id }))),
        filteredValue: filters.owner ?? null,
        render: (_: unknown, record: EquipmentItem) =>
          renderOwnerCell(record.owner as unknown as IPrimaryOwner),
      },
      {
        title: 'Status',
        key: 'status',
        width: 184,
        align: 'left' as const,
        onHeaderCell: () => ({ className: 'centeredFilterHeader' }),
        ...equipmentStaticColumnFilter(facetToAntdFilters(getFacetOptions(facets, 'status', 'status_type')) ?? EQUIPMENT_STATUS_FILTER_OPTIONS),
        filteredValue: filters.status ?? null,
        render: (_: unknown, record: EquipmentItem) => {
          const rawStatus = record.display_status?.value;
          return (
            <Tooltip title="Change status">
              <button
                type="button"
                className={tableStyles.statusButton}
                aria-label={`Change equipment status: ${rawStatus || 'Unknown'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenStatus(record);
                }}
              >
                <EquipmentStatus status={record.display_status} />
              </button>
            </Tooltip>
          );
        },
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right' as const,
        width: 120,
        align: 'center' as const,
        render: actionsRenderer,
      },
    );

    const priorityKeys = ['id', 'sku', 'name', 'image', 'status', 'agent', 'placement', 'owner', 'kind', 'type', 'manufacturer', 'product_model', 'serial_number'];
    const priorityColumns = priorityKeys.flatMap((key) => cols.filter((column) => column.key === key));
    return [...priorityColumns, ...cols.filter((column) => !priorityKeys.includes(String(column.key)))];
  }, [config, refData, facets, filters, kindFacetQuery, typeFacetQuery, manufacturerFacetQuery, modelFacetQuery, departmentFacetQuery, groupFacetQuery, actionsRenderer, handleOpenStatus, agentsByEquipment, agentsLoading, agentsData, openAgent]);

  return (
    <>
      <EquipmentPageLayout<EquipmentItem>
        professionalTable
        defaultVisibleColumnKeys={config.supportsAgent ? ['id', 'sku', 'name', 'image', 'status', 'agent', 'placement', 'owner', 'kind', 'type', 'manufacturer', 'product_model', 'actions'] : undefined}
        customSummary={<EquipmentInventoryOverview total={categorySummary?.total_count} statuses={categorySummary?.statuses} unknownCount={categorySummary?.unknown_status_count} loading={summaryLoading} statusTone={equipmentStatusTone} showAllOtherStatuses />}
        title={config.label}
        description={config.description}
        equipmentType={config.key}
        columns={columns}
        rows={rows}
        totalRecords={rows.length}
        clientPagination
        extraControls={<>
          <WorkbookImportButton />
          {(listData?.meta?.pagination?.count ?? rows.length) > rows.length ? <Tag color="warning">Showing {rows.length} of {listData?.meta?.pagination?.count} records returned by this request. Additional pages are unavailable until the backend's paging parameters are confirmed.</Tag> : null}
        </>}
        loading={isListLoading || isListFetching}
        onRefetch={refetchList}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, s) => {
          setPage(s === pageSize ? p : 1);
          setPageSize(s);
        }}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        filters={filters}
        onFiltersChange={(newFilters) => {
          const next = resetDependentFilters(normalizedFilters, Object.fromEntries(
            Object.entries(newFilters).map(([key, values]) => [key, values?.map(String) ?? null]),
          ));
          setFilters(next);
          setPage(1);
        }}
        showCreate={canManageLabOperations}
        createLabel={`New ${config.singular}`}
        onCreate={handleOpenCreate}
        scrollX={columns.reduce((total, column) => total + (typeof column.width === 'number' ? column.width : 160), 0)}
        onEditRecord={canManageLabOperations ? handleOpenEdit : undefined}
        searchPlaceholder="Search SKU, name or serial number"
      />

      <EquipmentStatusHistoryModal
        open={historyId !== null}
        onClose={() => setHistoryId(null)}
        title={historyTitle ?? 'Equipment status history'}
        loading={isStatusHistoryLoading}
        data={statusHistoryData?.data ?? []}
        page={historyPage}
        pageSize={historyPageSize}
        total={statusHistoryData?.meta.pagination.count ?? 0}
        onPageChange={(nextPage, nextPageSize) => {
          setHistoryPage(nextPageSize === historyPageSize ? nextPage : 1);
          setHistoryPageSize(nextPageSize);
        }}
      />

      <Modal title={`Placement: ${placementItem?.sku ?? ''}`} open={placementItem !== null} onCancel={() => setPlacementItem(null)}
        onOk={() => placementForm.submit()} okText="Save placement" confirmLoading={updatingPlacement} destroyOnHidden
        footer={(_, { OkBtn, CancelBtn }) => <><Button loading={clearingPlacement} disabled={!placementItem?.placement} onClick={async () => {
          if (!placementItem) return;
          try {
            await clearPlacement({ equipmentId: placementItem.id }).unwrap();
            await refetchList();
            setPlacementItem(null);
            notify.success('Placement cleared', { code: placementItem.sku || undefined });
          } catch (error) {
            notify.error('Unable to clear placement', {
              description: getApiErrorMessage(error, 'Please try again.'),
            });
          }
        }}>Clear placement</Button><CancelBtn /><OkBtn /></>}>
        <Form form={placementForm} layout="vertical" onFinish={async (values) => {
          if (!placementItem) return;
          const { target, target_id, location_note, role, position } = values;
          const targetId = target === 'room' || target === 'station' || target === 'bench' ? target_id : undefined;
          const equipmentPlacementWrite: EquipmentPlacementWrite = {
            ...(targetId !== undefined ? { [`${target}_id`]: targetId } : {}),
            location_note: location_note?.trim(), role, position,
          };
          try {
            await updatePlacement({ equipmentId: placementItem.id, equipmentPlacementWrite }).unwrap();
            refetchList();
            setPlacementItem(null);
            notify.success('Placement updated', { code: placementItem.sku || undefined });
          } catch (error) {
            notify.error('Unable to update placement', {
              description: getApiErrorMessage(error, 'Please try again.'),
            });
          }
        }}>
          <Form.Item name="target" label="Location type" rules={[{ required: true }]}>
            <Select options={['room', 'station', 'bench', 'note'].map((target) => ({ value: target, label: target[0].toUpperCase() + target.slice(1) }))} onChange={() => { placementForm.setFieldValue('target_id', undefined); setPlacementSearch(''); }} />
          </Form.Item>
          {placementTarget !== 'note' && <Form.Item name="target_id" label={`${placementTarget ?? 'Location'} ID`} rules={[{ required: true, type: 'number', min: 1 }]}>
            <Select showSearch filterOption={false} onSearch={setPlacementSearch} loading={loadingRooms || loadingStations || loadingBenches} options={placementOptions?.map(({ id, name, sku }) => ({ value: id, label: sku ? `${sku} — ${name}` : name })) ?? []} placeholder={`Search ${placementTarget ?? 'location'} by name or SKU`} />
          </Form.Item>}
          <Form.Item name="location_note" label="Location note" rules={placementTarget === 'note' ? [{ required: true }] : []}><Input /></Form.Item>
          <Form.Item name="role" label="Role"><Input /></Form.Item>
          <Form.Item name="position" label="Position"><InputNumber min={0} precision={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      {/* EquipmentFormModal for Create / Edit with complete field parity */}
      <EquipmentFormModal
        professionalForm
        open={formOpen}
        mode={formMode}
        title={formMode === 'create' ? `New ${config.singular}` : `Edit ${config.singular}`}
        fields={formFields}
        initialValues={formInitialValues}
        onSubmit={handleFormSubmit}
        onValuesChange={setFormValues}
        onCancel={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        loading={isCreating || isUpdating}
      />

      {config.supportsAgent && (
        <ComputingAgentDialog key={agentComputer?.id ?? 'closed'} computer={agentComputer} onClose={() => setAgentComputer(null)} />
      )}

      {/* Equipment lifecycle change-status action */}
      {statusItem && statusModalOpen && (
        <UpdateEquipmentStatusModal
          open={statusModalOpen}
          record={{
            ...statusItem,
            ...(freshStatusRecord ?? {}),
          }}
          key={statusItem.id}
          capabilities={categoryDetail?.data.capabilities?.map((capability) => capability.value) ?? []}
          benchOptions={benchOptions?.data ?? []}
          roomOptions={statusRoomOptions?.data ?? []}
          stationOptions={statusStationOptions?.data ?? []}
          loadingOptions={loadingBenches || loadingStatusRooms || loadingStatusStations}
          onSearchLocations={setStatusLocationSearch}
          onCancel={() => {
            setStatusModalOpen(false);
            setStatusItem(null);
          }}
          onSave={handleStatusSave}
        />
      )}
    </>
  );
};

export default UnifiedEquipmentPage;
