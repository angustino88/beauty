import { createStyles } from 'antd-style';

export const useBenchTableStyles = createStyles(({ css }) => ({
  customTableStyles: css`
    &.ant-card {
      border-radius: 12px;
      border: 1px solid var(--lm-border);
      background: var(--lm-surface);
      box-shadow: none;
      overflow: hidden;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 12px;
      margin-bottom: 12px;
    }
    .benchSearch { flex: 1 1 320px; }
    .toolbarActions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .ant-table-container {
      border: 1px solid var(--lm-border);
      border-radius: 10px;
      overflow: hidden;
    }
    .ant-table-thead > tr > th {
      background: var(--lm-surface-subtle) !important;
      border-bottom: 1px solid var(--lm-border) !important;
      color: var(--lm-text-secondary) !important;
      font-weight: 600 !important;
      font-size: 13px;
      padding: 10px 12px !important;
      line-height: 1.3;
      vertical-align: middle;
    }
    .ant-table-thead > tr > th .ant-table-column-sorters {
      padding: 0 !important;
      margin: 0 !important;
      min-height: 0 !important;
      align-items: center;
    }
    .ant-table-thead > tr > th .ant-table-filter-column {
      padding: 0 !important;
      margin: 0 !important;
      align-items: center;
    }
    .ant-table-thead .ant-table-filter-trigger {
      color: var(--lm-text-tertiary);
    }
    .ant-table-thead .ant-table-filter-trigger.active {
      color: var(--lm-primary-fg);
      background: var(--lm-primary-bg);
    }
    .ant-table-thead > tr > th .ant-table-column-title {
      padding: 0 !important;
      margin: 0 !important;
    }
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid var(--lm-border-subtle);
      color: var(--lm-text);
      padding: 10px 12px;
    }
    .ant-table-tbody > tr.ant-table-row { cursor: pointer; }
    .ant-table-tbody > tr:hover > td {
      background: var(--lm-surface-subtle) !important;
      transition: background 120ms ease;
    }
    .ant-table-tbody > tr.ant-table-row-selected > td {
      background: var(--lm-primary-bg) !important;
    }
    .resourceTags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
    }
    .benchName {
      padding: 0;
      border: 0;
      border-radius: 2px;
      color: var(--lm-primary-fg);
      background: transparent;
      font: inherit;
      font-weight: 600;
      text-align: start;
      text-decoration: underline;
      text-underline-offset: 3px;
      overflow-wrap: anywhere;
      cursor: pointer;
    }
    .benchName:hover { text-decoration-thickness: 2px; }
    .benchName:focus-visible {
      outline: 2px solid var(--lm-focus);
      outline-offset: 2px;
    }
    .benchGroup {
      display: block;
      max-inline-size: 24ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ant-table-pagination { margin-bottom: 0; }
    .ant-pagination-total-text { color: var(--lm-text-secondary); }

    @media (max-width: 575px) {
      &.ant-card > .ant-card-body { padding: 12px; }
      .ant-table-pagination { row-gap: 8px; }
    }
  `,

  favoriteActiveBtn: css`
    &:hover .anticon { color: var(--lm-primary) !important; }
  `,
}));
