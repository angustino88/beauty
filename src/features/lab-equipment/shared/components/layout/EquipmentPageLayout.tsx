import { useMemo, useState, type Key, type ReactNode } from 'react';
import { Button, Card, Checkbox, Col, Dropdown, Empty, Row, Table, Tag, Tooltip } from 'antd';
import { ClearOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { TooltipButton } from '@/components/layout/TooltipButton';
import { FullTextSearch } from '@/components/inputs/FullTextSearch';
import EquipmentSummary from '../cards/EquipmentSummary';
import ChangeLogModal from '../modals/ChangeLogModal';
import EquipmentDetailsModal from '../modals/EquipmentDetailsModal';
import SpaceStatusHistoryModal, { type SpaceStatusHistoryRecord } from '@/features/spaces/shared/SpaceStatusHistoryModal';
import type { IChangeLog } from '../../types/equipment.types';
import { getVisibleInventoryColumns, REQUIRED_INVENTORY_COLUMN_KEYS } from '../../utils/inventoryColumns';
import styles from './EquipmentTable.module.css';
import professional from './InventoryPresentation.module.css';
import { Boxes, Building2, ChevronDown, Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { Button as UiButton } from '@/components/ui/button';
import { Card as UiCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox as UiCheckbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { InventorySearch } from './InventorySearch';

export interface EquipmentPageLayoutProps<T extends { id: number | string }> {
  /** Page title (e.g. "Computer", "Monitor") */
  title: string;
  /** Equipment type for summary API (e.g. "computer", "monitor") */
  equipmentType: string;
  /** Whether to show license-style summary cards */
  isLicense?: boolean;
  /** Override summary data from list-based computation */
  summaryOverride?: Record<string, number | undefined>;
  summaryOverrideTotal?: number;
  /** Table columns */
  columns: ColumnsType<T>;
  /** Table data rows */
  rows: T[];
  /** Total records from API */
  totalRecords: number;
  /** Loading state */
  loading: boolean;
  /** Refetch function */
  onRefetch: () => void;
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
  /** Locally paginate a complete result set instead of requesting server pages. */
  clientPagination?: boolean;
  /** Page change handler */
  onPageChange: (page: number, pageSize: number) => void;
  /** Search value */
  search: string;
  /** Search change handler */
  onSearchChange: (value: string) => void;
  /** Filter state */
  filters: Record<string, Key[] | null>;
  /** Filter change handler */
  onFiltersChange: (filters: Record<string, Key[] | null>) => void;
  /** Show "New" button? Controlled by permissions */
  showCreate?: boolean;
  /** Create button label (e.g. "New Computer") */
  createLabel?: string;
  /** Create button handler */
  onCreate?: () => void;
  /** History modal data */
  historyData?: unknown[];
  historyLoading?: boolean;
  historyId?: number | string | null;
  historyOpen?: boolean;
  onHistoryClose?: () => void;
  historyTitle?: string;
  historyPage?: number;
  historyPageSize?: number;
  historyTotal?: number;
  onHistoryPageChange?: (page: number, pageSize: number) => void;
  /** Table scroll.x */
  scrollX?: number;
  /** Extra controls to render after the buttons */
  extraControls?: ReactNode;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Custom summary to render instead of EquipmentSummary */
  customSummary?: ReactNode;
  /** Lookup labels for reference IDs shown in the details drawer */
  detailValueLabels?: Record<string, Record<string, string>>;
  defaultVisibleColumnKeys?: string[];
  /** Singular noun for the record count, e.g. "license"; defaults from spaceKind, else "device". */
  itemNoun?: string;
  onEditRecord?: (id: number) => void;
  /** Opt-in presentation for the unified equipment inventory. */
  professionalTable?: boolean;
  /** Category description displayed with the professional inventory heading. */
  description?: string;
  /** Labels and default columns for room, station, and bench inventories. */
  spaceKind?: 'room' | 'station' | 'bench';
}

export default function EquipmentPageLayout<T extends { id: number | string }>({
  title,
  equipmentType,
  isLicense = false,
  summaryOverride,
  summaryOverrideTotal,
  columns,
  rows,
  totalRecords,
  loading,
  onRefetch,
  page,
  pageSize,
  clientPagination = false,
  onPageChange,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  showCreate,
  createLabel,
  onCreate,
  historyData,
  historyLoading,
  historyId,
  historyOpen,
  onHistoryClose,
  historyTitle,
  historyPage,
  historyPageSize,
  historyTotal,
  onHistoryPageChange,
  scrollX = 2000,
  extraControls,
  searchPlaceholder = 'Search by SKU, Name, Serial Number, etc.',
  customSummary,
  detailValueLabels,
  defaultVisibleColumnKeys,
  itemNoun,
  onEditRecord,
  professionalTable = false,
  description,
  spaceKind,
}: EquipmentPageLayoutProps<T>) {
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[] | undefined>(undefined);
  const inventoryDefaultKeys = spaceKind === 'room'
    ? ['id', 'sku', 'name', 'image', 'status', 'availability', 'location', 'country', 'building', 'capacity', 'primary_owner', 'actions']
    : spaceKind === 'station'
      ? ['id', 'sku', 'name', 'image', 'status', 'availability', 'room', 'bench_capacity', 'available_power_w', 'owner', 'actions']
      : spaceKind === 'bench'
        ? ['id', 'sku', 'name', 'image', 'status', 'availability', 'location', 'group', 'type', 'equipment_count', 'actions']
        : professionalTable ? ['id', 'sku', 'name', 'image', 'status', 'placement', 'owner', 'kind', 'type', 'manufacturer', 'product_model', 'actions'] : undefined;
  const enabledKeys = visibleKeys ?? defaultVisibleColumnKeys ?? inventoryDefaultKeys;
  const fixedColumnKeys = REQUIRED_INVENTORY_COLUMN_KEYS;
  const displayedColumns = useMemo(() => getVisibleInventoryColumns(columns, enabledKeys, filters)
    .map((column) => column.key === 'name' && !spaceKind ? {
      ...column,
      render: (value: unknown, record: T, index: number) => (
        <span className={professionalTable ? professional.nameCell : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {!professionalTable && <Tooltip title="View equipment details">
            <Button type="text" size="small" aria-label="View equipment details" icon={<EyeOutlined />} onClick={(event) => {
              event.stopPropagation();
              setSelectedRecord(record);
            }} />
          </Tooltip>}
          {professionalTable ? (
            <button type="button" className={professional.nameLink} aria-label={`Open details for ${String(value ?? record.id)}`} onClick={(event) => {
              event.stopPropagation();
              setSelectedRecord(record);
            }}>
              {column.render ? column.render(value, record, index) as ReactNode : String(value ?? '—')}
            </button>
          ) : (
          <span style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
            {column.render ? column.render(value, record, index) as ReactNode : String(value ?? '—')}
          </span>
          )}
        </span>
      ),
    } : column), [columns, enabledKeys, filters, professionalTable, spaceKind]);
  const visibleWidth = defaultVisibleColumnKeys || professionalTable
    ? displayedColumns.reduce((total, column) => total + (typeof column.width === 'number' ? column.width : 160), 0)
    : scrollX;
  const activeFilterCount = Object.values(filters).filter((values) => values?.length).length;
  const selectableColumns = columns.filter((column) => !fixedColumnKeys.includes(String(column.key)));
  const selectedColumnCount = selectableColumns.filter((column) => !enabledKeys || enabledKeys.includes(String(column.key)) || filters[String(column.key)]?.length).length;
  const itemLabel = itemNoun ?? (spaceKind === 'room' ? 'room' : spaceKind === 'station' ? 'station' : spaceKind === 'bench' ? 'bench' : 'device');
  const itemPlural = /(s|x|ch|sh)$/.test(itemLabel) ? `${itemLabel}es` : `${itemLabel}s`;

  const readPath = (record: Record<string, unknown>, path: string): unknown =>
    path.split('.').reduce<unknown>((acc, key) => (
      acc && typeof acc === 'object' && !Array.isArray(acc)
        ? (acc as Record<string, unknown>)[key]
        : undefined
    ), record);

  const pickStringPath = (record: Record<string, unknown>, paths: string[]): string | undefined => {
    for (const path of paths) {
      const raw = readPath(record, path);
      if (typeof raw === 'string' && raw.trim()) return raw.trim();
    }
    return undefined;
  };

  const inferredHistoryTitle = (() => {
    if (historyTitle) return historyTitle;
    if (historyId == null) return `${title} Change History`;
    const matched = rows.find((row) => String(row.id) === String(historyId));
    if (!matched) return `${title} Change History`;

    const record = matched as unknown as Record<string, unknown>;
    const sku = pickStringPath(record, ['sku', 'lab.sku']);
    const name = pickStringPath(record, [
      'name',
      'lab_name',
      'computer_name',
      'accessory_name',
      'monitor_name',
      'network_interface_name',
      'powersupply_name',
      'debug_hardware_name',
      'rack_name',
      'room_name',
      'license_name',
    ]);

    if (sku && name) return `${sku} | ${name}`;
    return sku ?? name ?? `${title} #${historyId}`;
  })();

  const handleClearAll = () => {
    if (Object.keys(filters).length === 0 && !search) return;
    onSearchChange('');
    onFiltersChange({});
    onPageChange(1, pageSize);
  };

  const Surface = professionalTable ? UiCard : Card;

  return (
    <div className={professionalTable ? professional.page : undefined} style={{ display: 'flex', flexDirection: 'column', gap: professionalTable ? 18 : 8 }}>
      {professionalTable ? (
        <header className={`${professional.pageHeading} tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4`}>
          <div className={professional.headingCopy}>
            <div className={professional.breadcrumb}>{spaceKind ? 'Spaces' : 'Lab equipment'} <span aria-hidden="true">/</span> {title}</div>
            <div className="tw:flex tw:items-center tw:gap-3">
              <span className="tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-xl tw:bg-secondary tw:text-primary">
                {spaceKind ? <Building2 aria-hidden="true" className="tw:size-5" /> : <Boxes aria-hidden="true" className="tw:size-5" />}
              </span>
              <h1>{title}</h1>
            </div>
            {description && <p>{description}</p>}
          </div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <UiButton variant="outline" size="icon" title="Refresh inventory" aria-label={`Refresh ${spaceKind ? `${spaceKind}s` : 'equipment'}`} onClick={onRefetch}>
              <RotateCcw className={loading ? 'tw:animate-spin tw:motion-reduce:animate-none' : ''} />
            </UiButton>
            {showCreate && onCreate && <UiButton onClick={onCreate}><Plus />{createLabel ?? `New ${title}`}</UiButton>}
          </div>
        </header>
      ) : <PageHeader title={title} />}

      <div className={spaceKind && !customSummary ? professional.spaceSummary : professionalTable ? professional.summary : undefined}>
      {customSummary ?? (
        <EquipmentSummary
          equipmentType={equipmentType}
          isLicense={isLicense}
          overrideData={summaryOverride}
          overrideTotal={summaryOverrideTotal}
        />
      )}
      </div>

      <Surface className={professionalTable ? `${professional.inventory} tw:overflow-hidden` : styles.tableCard}>
        {professionalTable && <div className={professional.inventoryHeading}>
          <div>
            <h2>{spaceKind ? title : `${title} inventory`}</h2>
            <span>{loading ? `Loading ${title.toLowerCase()}…` : `${totalRecords} ${totalRecords === 1 ? itemLabel : itemPlural} in this view`}</span>
          </div>
          <Badge>{loading ? 'Loading…' : `${totalRecords.toLocaleString()} ${totalRecords === 1 ? 'record' : 'records'}`}</Badge>
        </div>}
        {professionalTable && <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:border-0 tw:border-b tw:border-solid tw:border-border tw:px-5 tw:pb-4 tw:pt-3">
          <div className="tw:min-w-0 tw:flex-[1_1_320px] tw:max-w-xl">
            <InventorySearch value={search} placeholder={searchPlaceholder} onSearch={(value) => {
              onSearchChange(value);
              onPageChange(1, pageSize);
            }} />
          </div>
          <div className="tw:ml-auto tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            {activeFilterCount > 0 && <Badge>{activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}</Badge>}
            {(activeFilterCount > 0 || search) && <UiButton variant="ghost" size="sm" onClick={handleClearAll} aria-label="Clear search and filters"><X />Clear filters</UiButton>}
            <Popover>
              <PopoverTrigger asChild><UiButton variant="outline" aria-label="Choose visible columns"><SlidersHorizontal />View options<ChevronDown /></UiButton></PopoverTrigger>
              <PopoverContent aria-label="Visible columns">
                <div className="tw:mb-3 tw:px-1">
                  <h3 className="tw:m-0 tw:text-sm tw:font-semibold">Visible columns</h3>
                  <p className="tw:mt-1 tw:text-xs tw:text-muted-foreground">Customize your inventory view.</p>
                </div>
                <label className="tw:mb-2 tw:flex tw:items-center tw:gap-2 tw:border-0 tw:border-b tw:border-solid tw:border-border tw:px-1 tw:pb-3 tw:text-sm">
                  <UiCheckbox checked={selectedColumnCount === selectableColumns.length ? true : selectedColumnCount > 0 ? 'indeterminate' : false} onCheckedChange={(checked) => {
                    setVisibleKeys(checked === true ? columns.map((column) => String(column.key)) : columns.filter((column) => fixedColumnKeys.includes(String(column.key)) || filters[String(column.key)]?.length).map((column) => String(column.key)));
                  }} />Select all
                </label>
                <div className="tw:max-h-72 tw:overflow-y-auto">
                  {selectableColumns.map((column) => <label key={String(column.key)} className="tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-md tw:px-1 tw:py-2 tw:text-sm tw:hover:bg-muted">
                    <UiCheckbox disabled={Boolean(filters[String(column.key)]?.length)} checked={Boolean(filters[String(column.key)]?.length) || !enabledKeys || enabledKeys.includes(String(column.key))} onCheckedChange={(checked) => {
                      const current = enabledKeys ?? columns.map((item) => String(item.key));
                      setVisibleKeys(checked === true ? [...current, String(column.key)] : current.filter((key) => key !== String(column.key)));
                    }} />{typeof column.title === 'string' ? column.title : String(column.key)}
                  </label>)}
                </div>
                <UiButton variant="ghost" size="sm" className="tw:mt-2 tw:w-full" onClick={() => setVisibleKeys(undefined)}>Restore default columns</UiButton>
              </PopoverContent>
            </Popover>
            {extraControls}
          </div>
        </div>}
        {!professionalTable && <>
        <Row
          className={styles.toolbar}
          justify="space-between"
        >
          <Col flex="auto" className={professionalTable ? professional.searchColumn : undefined}>
            <FullTextSearch
              className={styles.search}
              value={search}
              onSearch={(value) => {
                onSearchChange(value);
                onPageChange(1, pageSize);
              }}
              placeholder={searchPlaceholder}
            />
          </Col>
          <Col className={styles.actions}>
            {activeFilterCount > 0 && <Tag className={professional.activeFilters}>{activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}</Tag>}
            {(defaultVisibleColumnKeys || professionalTable) && (
              <Dropdown trigger={['click']} popupRender={() => (
                <div className={professionalTable ? professional.columnMenu : undefined} style={{ padding: 12, background: 'var(--lm-surface-raised)', boxShadow: 'var(--lm-shadow-md)', border: '1px solid var(--lm-border)', borderRadius: 8, maxHeight: 400, overflowY: 'auto', minWidth: 220 }}>
                  {professionalTable && <strong className={professional.menuTitle}>Visible columns</strong>}
                  <div style={{ padding: '4px 4px 10px', borderBottom: '1px solid var(--lm-border)', marginBottom: 6 }}>
                    <Checkbox checked={selectedColumnCount === selectableColumns.length} indeterminate={selectedColumnCount > 0 && selectedColumnCount < selectableColumns.length} onChange={(event) => {
                      setVisibleKeys(event.target.checked ? columns.map((column) => String(column.key)) : columns.filter((column) => fixedColumnKeys.includes(String(column.key)) || filters[String(column.key)]?.length).map((column) => String(column.key)));
                    }}>Select all</Checkbox>
                  </div>
                  {columns.filter((column) => !fixedColumnKeys.includes(String(column.key))).map((column) => (
                    <div key={String(column.key)} style={{ padding: 4 }}>
                      <Checkbox disabled={Boolean(filters[String(column.key)]?.length)} checked={Boolean(filters[String(column.key)]?.length) || !enabledKeys || enabledKeys.includes(String(column.key))} onChange={(event) => {
                        const current = enabledKeys ?? columns.map((item) => String(item.key));
                        setVisibleKeys(event.target.checked ? [...current, String(column.key)] : current.filter((key) => key !== String(column.key)));
                      }}>{typeof column.title === 'string' ? column.title : String(column.key)}</Checkbox>
                    </div>
                  ))}
                  <Button size="small" type="link" onClick={() => setVisibleKeys(undefined)}>Restore default columns</Button>
                </div>
              )}>
                <Button aria-label={professionalTable ? 'Choose visible columns' : 'Columns'} icon={<SettingOutlined />}>{professionalTable ? 'View options' : 'Columns'}</Button>
              </Dropdown>
            )}
            {(!professionalTable || activeFilterCount > 0 || search) && <TooltipButton responsive tooltip="Clear search and filters" icon={<ClearOutlined />} onClick={handleClearAll}>
              Clear filters
            </TooltipButton>}
            <TooltipButton responsive tooltip={`Reload ${itemPlural}`} icon={<ReloadOutlined spin={professionalTable && loading} />} onClick={onRefetch}>
              Refresh
            </TooltipButton>
            {professionalTable && showCreate && onCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} className={professional.createButton}>
                {createLabel ?? `New ${title}`}
              </Button>
            )}
            {!professionalTable && showCreate && onCreate && (
              <TooltipButton
                responsive
                tooltip={`Add a new ${itemLabel}`}
                type="primary"
                icon={<PlusOutlined />}
                onClick={onCreate}
              >
                {createLabel ?? `New ${title}`}
              </TooltipButton>
            )}
            {extraControls}
          </Col>
        </Row>
        </>}

        {professionalTable && search && (
          <div className={professional.searchContext}>
            Search results for <Tag closable onClose={() => { onSearchChange(''); onPageChange(1, pageSize); }}>{search}</Tag>
          </div>
        )}
        <Table<T>
          className={`${styles.table} ${professionalTable ? professional.grid : ''}`}
          columns={displayedColumns}
          dataSource={clientPagination ? rows.slice((page - 1) * pageSize, page * pageSize) : rows}
          rowKey="id"
          loading={{ spinning: loading, description: 'Loading...' }}
          tableLayout="fixed"
          sticky={professionalTable ? false : { offsetHeader: 60 }}
          scroll={{ x: visibleWidth, ...(professionalTable ? {} : { y: 'calc(100vh - 360px)' }) }}
          locale={{ emptyText: loading ? <span style={{ display: 'none' }} /> : professionalTable ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={
              <div className={professional.emptyState}>
                <strong>{search || activeFilterCount ? `No matching ${itemPlural}` : `No ${itemPlural} registered`}</strong>
                <span>{search || activeFilterCount ? 'Try a different search or clear the active filters.' : `${title} will appear here once added.`}</span>
                {(search || activeFilterCount > 0) && <Button onClick={handleClearAll}>Clear search and filters</Button>}
              </div>
            } />
          ) : 'No records found' }}
          rowClassName={(_, index) => (index % 2 === 1 ? 'stripedRow' : '')}
          onRow={(record) => ({
            onClick: (event) => {
              const target = event.target as HTMLElement;
              if (target.closest('button, a, input, textarea, select, [role="button"], .ant-select, .ant-picker')) return;
              const row = event.currentTarget as HTMLElement;
              if (row.querySelector('input, textarea, select, .ant-select, .ant-picker, .ant-upload')) return;
              setSelectedRecord(record);
            },
            className: styles.clickableRow,
          })}
          onChange={(pagination, tableFilters, _sorter, extra) => {
            if (extra.action === 'filter') {
              onFiltersChange(tableFilters as Record<string, Key[] | null>);
              return;
            }

            onPageChange(pagination.current ?? 1, pagination.pageSize ?? pageSize);
          }}
          pagination={{
            total: totalRecords,
            current: page,
            pageSize,
            pageSizeOptions: [5, 10, 25, 50],
            showSizeChanger: true,
            showQuickJumper: {
            },
            showTotal: (total, range) => {
              if (!total) return 'No data';
              return `${range[0]} - ${range[1]} of ${total} items`;
            },
          }}
        />
      </Surface>

      <EquipmentDetailsModal
        open={selectedRecord !== null}
        equipmentType={equipmentType}
        record={(rows.find((row) => row.id === selectedRecord?.id) ?? selectedRecord) as (Record<string, unknown> & { id: number | string }) | null}
        detailValueLabels={detailValueLabels}
        onClose={() => setSelectedRecord(null)}
        onEdit={onEditRecord && selectedRecord ? () => {
          onEditRecord(Number(selectedRecord.id));
          setSelectedRecord(null);
        } : undefined}
      />

      {onHistoryClose && spaceKind && historyPage !== undefined && historyPageSize !== undefined && onHistoryPageChange ? (
        <SpaceStatusHistoryModal
          open={!!historyOpen}
          onClose={onHistoryClose}
          title={inferredHistoryTitle}
          data={(historyData ?? []) as SpaceStatusHistoryRecord[]}
          loading={!!historyLoading}
          page={historyPage}
          pageSize={historyPageSize}
          total={historyTotal ?? 0}
          onPageChange={onHistoryPageChange}
        />
      ) : onHistoryClose && (
        <ChangeLogModal
          open={!!historyOpen}
          onClose={onHistoryClose}
          data={(historyData ?? []) as IChangeLog[]}
          loading={!!historyLoading}
          title={inferredHistoryTitle}
        />
      )}
    </div>
  );
}
