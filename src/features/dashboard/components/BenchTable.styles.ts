import { createStyles } from 'antd-style';

export const useBenchTableStyles = createStyles(({ css }) => ({
  customTableStyles: css`
    &.ant-card {
      border-radius: 16px;
      border: 1px solid rgba(56, 42, 34, 0.20);
      background: linear-gradient(180deg, #fffef9 0%, #f7f0e6 100%);
      box-shadow: 0 16px 34px rgba(31, 24, 18, 0.10);
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
      border: 1px solid rgba(56, 42, 34, 0.12);
      border-radius: 12px;
      pointer-events: none;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.40);
    }
    .ant-card-body {
      position: relative;
      z-index: 1;
    }
    .toolbar {
      position: relative;
      border-radius: 14px;
      border: 1px solid rgba(56, 42, 34, 0.16);
      background: linear-gradient(180deg, rgba(255, 254, 249, 0.98) 0%, rgba(249, 243, 233, 0.98) 100%);
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
        rgba(123, 45, 38, 0.78) 16%,
        rgba(123, 45, 38, 0.78) 84%,
        rgba(0, 0, 0, 0) 100%
      );
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 1px 0 rgba(0, 0, 0, 0.10);
      opacity: 0.85;
      pointer-events: none;
    }
    .toolbar > * { margin-top: 14px; }
    .toolbar .ant-input-affix-wrapper {
      border-radius: 14px !important;
      border: 1px solid rgba(56, 42, 34, 0.22) !important;
      background: linear-gradient(180deg, rgba(255, 254, 246, 0.92) 0%, rgba(250, 245, 236, 0.92) 100%) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65) !important;
    }
    .toolbar .ant-input-affix-wrapper > input.ant-input {
      border: 0 !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .toolbar .ant-input-affix-wrapper:hover {
      border-color: rgba(123, 45, 38, 0.35) !important;
    }
    .toolbar .ant-input-affix-wrapper-focused,
    .toolbar .ant-input-affix-wrapper:focus-within {
      border-color: rgba(123, 45, 38, 0.55) !important;
      box-shadow: 0 0 0 3px rgba(123, 45, 38, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.65) !important;
    }
    .toolbar .ant-btn {
      border-radius: 14px;
      border: 1px solid rgba(56, 42, 34, 0.22);
      background: linear-gradient(180deg, rgba(255, 254, 246, 0.92) 0%, rgba(250, 245, 236, 0.92) 100%);
      color: rgba(34, 28, 23, 0.88);
      font-weight: 800;
      letter-spacing: 0.02em;
      box-shadow: 0 10px 18px rgba(31, 24, 18, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.55);
      transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
    }
    .toolbar .ant-btn:hover {
      transform: translateY(-1px);
      border-color: rgba(123, 45, 38, 0.35);
      box-shadow: 0 14px 22px rgba(31, 24, 18, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.55);
      color: rgba(34, 28, 23, 0.92);
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
      border: 1px solid rgba(56, 42, 34, 0.18);
      border-radius: 12px;
      background: rgba(255, 254, 246, 0.78);
    }
    .ant-table-thead > tr > th {
      background: linear-gradient(180deg, rgba(255, 254, 249, 1) 0%, rgba(246, 240, 230, 1) 100%) !important;
      border-bottom: 2px solid rgba(56, 42, 34, 0.26) !important;
      color: rgba(34, 28, 23, 0.90) !important;
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
      background: rgba(255, 254, 248, 0.72);
      border-bottom: 1px solid rgba(56, 42, 34, 0.12);
      color: rgba(34, 28, 23, 0.88);
      padding: 12px 16px;
    }
    .ant-table-tbody > tr:nth-child(2n) > td {
      background: rgba(250, 246, 238, 0.62);
    }
    .ant-table-tbody > tr:hover > td {
      background: rgba(123, 45, 38, 0.085) !important;
      transition: background 120ms ease;
    }
    .ant-table-tbody > tr > td.ant-table-column-sort,
    .ant-table-tbody > tr.ant-table-row-selected > td {
      background: rgba(11, 110, 122, 0.06) !important;
    }
    .ant-pagination,
    .ant-pagination * {
      color: rgba(34, 28, 23, 0.80);
    }
    /* Sample tags: green tint */
    .sampleTags .ant-tag {
      background: rgba(47, 111, 79, 0.16);
      border-color: rgba(47, 111, 79, 0.36);
      color: rgba(10, 38, 25, 0.92);
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.40);
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
      color: rgba(34, 10, 68, 0.92);
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.40);
    }
  `,

  favoriteActiveBtn: css`
    &:hover .anticon { color: #faad14 !important; }
  `,
}));

export const useLabDeviceTableStyles = useBenchTableStyles;
