import { createStyles } from 'antd-style';

export const useBenchTableStyles = createStyles(({ css }) => ({
  customTableStyles: css`
    &.ant-card {
      border-radius: 16px;
      border: 1px solid color-mix(in srgb, var(--lm-paper-edge) 20%, transparent);
      background: linear-gradient(180deg, var(--lm-paper-top) 0%, var(--lm-paper-bottom) 100%);
      box-shadow: 0 16px 34px rgba(31, 24, 18, 0.1);
      overflow: hidden;
      position: relative;
    }
    &.ant-card::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.08;
      mix-blend-mode: multiply;
      background:
        radial-gradient(rgba(0, 0, 0, 0.12) 0.55px, transparent 0.65px),
        radial-gradient(rgba(0, 0, 0, 0.08) 0.55px, transparent 0.65px);
      background-position: 0 0, 13px 19px;
      background-size: 26px 26px;
    }
    &.ant-card::after {
      content: "";
      position: absolute;
      inset: 10px;
      border: 1px solid color-mix(in srgb, var(--lm-paper-edge) 12%, transparent);
      border-radius: 12px;
      pointer-events: none;
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 40%, transparent);
    }
    .ant-card-body {
      position: relative;
      z-index: 1;
    }
    .toolbar {
      position: relative;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--lm-paper-edge) 16%, transparent);
      background: linear-gradient(180deg, color-mix(in srgb, var(--lm-paper-top) 98%, transparent) 0%, color-mix(in srgb, var(--lm-paper-bottom) 98%, transparent) 100%);
      box-shadow: 0 10px 20px rgba(31, 24, 18, 0.08);
      padding: 12px;
      margin-bottom: 12px;
    }
    .toolbar::before {
      content: "";
      position: absolute;
      left: 10px;
      right: 10px;
      top: 10px;
      height: 14px;
      border-radius: 10px;
      background: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0) 0%,
        color-mix(in srgb, var(--lm-paper-accent) 78%, transparent) 16%,
        color-mix(in srgb, var(--lm-paper-accent) 78%, transparent) 84%,
        rgba(0, 0, 0, 0) 100%
      );
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 28%, transparent), 0 1px 0 rgba(0, 0, 0, 0.10);
      opacity: 0.85;
      pointer-events: none;
    }
    .toolbar > * { margin-top: 14px; }
    .toolbar .ant-input-affix-wrapper {
      border-radius: 14px !important;
      border: 1px solid color-mix(in srgb, var(--lm-paper-edge) 22%, transparent) !important;
      background: linear-gradient(180deg, color-mix(in srgb, var(--lm-paper-top) 92%, transparent) 0%, color-mix(in srgb, var(--lm-paper-bottom) 92%, transparent) 100%) !important;
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 65%, transparent) !important;
    }
    .toolbar .ant-input-affix-wrapper > input.ant-input {
      border: 0 !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .toolbar .ant-input-affix-wrapper:hover {
      border-color: color-mix(in srgb, var(--lm-paper-accent) 35%, transparent) !important;
    }
    .toolbar .ant-input-affix-wrapper-focused,
    .toolbar .ant-input-affix-wrapper:focus-within {
      border-color: color-mix(in srgb, var(--lm-paper-accent) 55%, transparent) !important;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--lm-paper-accent) 18%, transparent), inset 0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 65%, transparent) !important;
    }
    .toolbar .ant-btn {
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--lm-paper-edge) 22%, transparent);
      background: linear-gradient(180deg, color-mix(in srgb, var(--lm-paper-top) 92%, transparent) 0%, color-mix(in srgb, var(--lm-paper-bottom) 92%, transparent) 100%);
      color: color-mix(in srgb, var(--lm-paper-ink) 88%, transparent);
      font-weight: 800;
      letter-spacing: 0.02em;
      box-shadow: 0 10px 18px rgba(31, 24, 18, 0.1), inset 0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 55%, transparent);
      transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
    }
    .toolbar .ant-btn:hover {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--lm-paper-accent) 35%, transparent);
      box-shadow: 0 14px 22px rgba(31, 24, 18, 0.14), inset 0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 55%, transparent);
      color: color-mix(in srgb, var(--lm-paper-ink) 92%, transparent);
    }
    .toolbar .ant-btn:active {
      transform: translateY(0px);
      box-shadow: 0 8px 14px rgba(31, 24, 18, 0.12), inset 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .ant-table {
      border-radius: 12px;
      overflow: hidden;
    }
    .ant-table-container {
      border: 1px solid color-mix(in srgb, var(--lm-paper-edge) 18%, transparent);
      border-radius: 12px;
      background: color-mix(in srgb, var(--lm-paper-top) 78%, transparent);
    }
    .ant-table-thead > tr > th {
      background: linear-gradient(180deg, var(--lm-paper-top) 0%, var(--lm-paper-bottom) 100%) !important;
      border-bottom: 2px solid color-mix(in srgb, var(--lm-paper-edge) 26%, transparent) !important;
      color: color-mix(in srgb, var(--lm-paper-ink) 90%, transparent) !important;
      font-weight: 900 !important;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 11px;
      padding: 10px 16px !important;
      line-height: 1.2;
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
      justify-content: center;
    }
    .ant-table-thead > tr > th .ant-table-column-title {
      padding: 0 !important;
      margin: 0 !important;
    }
    .ant-table-tbody > tr > td {
      background: color-mix(in srgb, var(--lm-paper-top) 72%, transparent);
      border-bottom: 1px solid color-mix(in srgb, var(--lm-paper-edge) 12%, transparent);
      color: color-mix(in srgb, var(--lm-paper-ink) 88%, transparent);
      padding: 12px 16px;
    }
    .ant-table-tbody > tr:nth-child(2n) > td {
      background: color-mix(in srgb, var(--lm-paper-bottom) 62%, transparent);
    }
    .ant-table-tbody > tr:hover > td {
      background: color-mix(in srgb, var(--lm-paper-accent) 8.5%, transparent) !important;
      transition: background 120ms ease;
    }
    .ant-table-tbody > tr > td.ant-table-column-sort,
    .ant-table-tbody > tr.ant-table-row-selected > td {
      background: rgba(11, 110, 122, 0.06) !important;
    }
    .ant-pagination,
    .ant-pagination * {
      color: color-mix(in srgb, var(--lm-paper-ink) 80%, transparent);
    }
    /* Sample tags: green tint */
    .sampleTags .ant-tag {
      background: rgba(47, 111, 79, 0.16);
      border-color: rgba(47, 111, 79, 0.36);
      color: color-mix(in srgb, var(--lm-paper-ink) 92%, transparent);
      font-weight: 700;
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 40%, transparent);
    }
    /* License tags: purple tint */
    .licenseTags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
    }
    .licenseTags .ant-tag {
      margin: 0;
      background: rgba(92, 45, 145, 0.16);
      border-color: rgba(92, 45, 145, 0.40);
      color: color-mix(in srgb, var(--lm-primary-fg) 92%, transparent);
      font-weight: 700;
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--lm-paper-highlight) 40%, transparent);
    }
  `,

  favoriteActiveBtn: css`
    &:hover .anticon { color: var(--lm-primary) !important; }
  `,
}));

export const useLabDeviceTableStyles = useBenchTableStyles;
