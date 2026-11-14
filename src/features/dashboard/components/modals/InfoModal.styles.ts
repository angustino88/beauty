import { createStyles } from 'antd-style';

export const useInfoModalStyles = createStyles(({ css }) => ({
  modalContent: css`
    display: grid;
    gap: 16px;
    width: 100%;
    min-width: 0;
    padding: 2px 2px 2px 0;
    color: var(--lm-text);
  `,
  deviceHero: css`
    display: grid;
    grid-template-columns: 164px minmax(0, 1fr);
    min-height: 176px;
    overflow: hidden;
    border: 1px solid var(--lm-border-strong);
    border-radius: 8px;
    background: var(--lm-surface-subtle);

    @media (max-width: 640px) { grid-template-columns: 1fr; }
  `,
  deviceVisual: css`
    position: relative;
    display: grid;
    min-height: 176px;
    place-items: center;
    overflow: hidden;
    background: linear-gradient(var(--lm-border) 1px, transparent 1px), linear-gradient(90deg, var(--lm-border) 1px, transparent 1px), var(--lm-surface-muted);
    background-size: 18px 18px;

    .ant-image, .ant-image-img { width: 100%; height: 100%; min-height: 176px; }
    .ant-image-img { object-fit: cover; }
  `,
  deviceFallback: css`
    display: grid;
    gap: 12px;
    place-items: center;
    color: var(--lm-text-tertiary);
    font-size: 12px;
    font-weight: 700;
    > .anticon { font-size: 58px; }
  `,
  visualCaption: css`
    position: absolute;
    right: 12px;
    bottom: 12px;
    left: 12px;
    overflow: hidden;
    padding: 7px 9px;
    border: 1px solid var(--lm-border);
    border-radius: 4px;
    background: var(--lm-surface);
    color: var(--lm-text-secondary);
    font-family: var(--lm-font-mono);
    font-size: 10px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  deviceIdentity: css`
    min-width: 0;
    padding: 18px 20px;
    h3.ant-typography { margin: 2px 0 0; color: var(--lm-text); font-size: 24px; line-height: 1.2; letter-spacing: 0; }

    @media (max-width: 480px) {
      padding: 18px;
    }
  `,
  titleLine: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    > div { min-width: 0; }

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 12px;
    }
  `,
  titleIdentity: css`
    flex: 1 1 auto;
  `,
  statusMeta: css`
    display: inline-flex;
    flex: 0 0 auto;
    min-width: 0;
    align-items: center;
    gap: 10px;
    padding: 8px 11px;
    border: 1px solid var(--lm-border-strong);
    border-radius: 6px;
    background: var(--lm-surface);
    > span:first-child { padding-right: 10px; border-right: 1px solid var(--lm-border); color: var(--lm-text-tertiary); font-size: 10px; font-weight: 600; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.04em; }
    > small { color: var(--lm-text-tertiary); font-size: 11px; font-weight: 500; white-space: nowrap; font-variant-numeric: tabular-nums; }

    @media (max-width: 480px) {
      width: 100%;
      justify-content: space-between;
    }
  `,
  eyebrow: css`
    color: var(--lm-text-tertiary);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  `,
  quickFacts: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid var(--lm-border);
    border-radius: 6px;
    background: var(--lm-surface);
    > div { display: flex; min-width: 0; align-items: center; gap: 10px; padding: 10px 12px; color: var(--lm-primary-fg); font-size: 15px; }
    > div:nth-child(odd) { border-right: 1px solid var(--lm-border); }
    > div:nth-child(-n + 2) { border-bottom: 1px solid var(--lm-border); }
    span, strong { display: block; min-width: 0; }
    span { color: var(--lm-text-secondary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
    strong { overflow: hidden; margin-top: 3px; color: var(--lm-text); font-size: 14px; line-height: 1.35; text-overflow: ellipsis; text-transform: none; }
    a { color: var(--lm-primary-fg); text-decoration: underline; text-underline-offset: 2px; }
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
      > div:nth-child(odd) { border-right: 0; }
      > div:not(:last-child) { border-bottom: 1px solid var(--lm-border); }
    }
  `,
  remark: css`
    margin-top: 12px;
    padding: 7px 10px;
    border-left: 3px solid var(--lm-neutral-solid);
    background: var(--lm-surface-muted);
    color: var(--lm-text-secondary);
    font-size: 12px;
    line-height: 1.45;
  `,
  activityStrip: css`
    padding: 14px 16px 16px;
    border: 1px solid var(--lm-border-strong);
    border-radius: 8px;
    background: var(--lm-surface-subtle);
  `,
  sectionHeading: css`
    display: flex;
    align-items: center;
    gap: 10px;
    div { display: grid; gap: 1px; }
    strong { color: var(--lm-text); font-size: 15px; line-height: 1.3; }
    div > span { color: var(--lm-text-tertiary); font-size: 11px; line-height: 1.35; }
  `,
  headingIcon: css`
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border-radius: 6px;
    background: var(--lm-primary-bg);
    color: var(--lm-primary-fg);
    font-size: 15px;
  `,
  activityFlow: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    margin-top: 12px;
    overflow: hidden;
    border: 1px solid var(--lm-border);
    border-radius: 6px;
    background: var(--lm-surface);
    > div { display: grid; grid-template-columns: 30px minmax(0, 1fr); min-width: 0; min-height: 64px; align-items: center; gap: 10px; padding: 12px 14px; color: var(--lm-text-secondary); }
    > div > .anticon { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 5px; background: var(--lm-surface-muted); font-size: 15px; }
    > div:nth-of-type(2), > div:nth-of-type(3) { border-left: 1px solid var(--lm-border); }
    span, strong { display: block; min-width: 0; }
    div > span { width: 100%; color: var(--lm-text-tertiary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
    strong { overflow: hidden; margin-top: 4px; color: var(--lm-text); font-size: 14px; line-height: 1.35; text-overflow: ellipsis; text-transform: none; white-space: nowrap; }
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
      > div:nth-of-type(2), > div:nth-of-type(3) { border-top: 1px solid var(--lm-border); border-left: 0; }
    }
  `,
  remoteUserValue: css`
    display: block;
    overflow: hidden;
    width: 100%;
    color: inherit;
    font: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  inventorySection: css`
    min-width: 0;
    padding: 16px 18px 18px;
    border: 1px solid var(--lm-border-strong);
    border-radius: 8px;
    background: var(--lm-surface);
  `,
  inventoryHeading: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  `,
  inventoryTotal: css`
    display: flex;
    align-items: baseline;
    gap: 5px;
    color: var(--lm-text-tertiary);
    font-size: 9px;
    text-transform: uppercase;
    strong { color: var(--lm-primary-fg); font-size: 22px; font-variant-numeric: tabular-nums; }
  `,
  equipmentGrid: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
    @media (max-width: 700px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (max-width: 460px) { grid-template-columns: 1fr; }
  `,
  equipmentGroup: css`
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--lm-border);
    border-radius: 6px;
    background: var(--lm-surface-subtle);
  `,
  equipmentGroupHeader: css`
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 10px;
    border-bottom: 1px solid var(--lm-border);
  `,
  equipmentIcon: css`
    display: grid;
    width: 25px;
    height: 25px;
    flex: 0 0 25px;
    place-items: center;
    border-radius: 5px;
    background: var(--lm-primary-bg);
    color: var(--lm-primary-fg);
    font-size: 13px;
  `,
  equipmentLabel: css`
    overflow: hidden;
    color: var(--lm-text);
    font-size: 11px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  equipmentCount: css`
    margin-left: auto;
    color: var(--lm-text-tertiary);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  `,
  equipmentItems: css`
    display: grid;
    gap: 1px;
    padding: 5px;
  `,
  equipmentItem: css`
    min-width: 0;
    padding: 9px 8px;
    border-radius: 4px;
    background: var(--lm-surface);
    color: var(--lm-text);
    font-size: 12px;
    font-weight: 700;
  `,
  equipmentMeta: css`
    display: block;
    overflow: hidden;
    margin-top: 3px;
    color: var(--lm-text-tertiary);
    font-family: var(--lm-font-mono);
    font-size: 9px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  emptyInventory: css`
    padding: 24px;
    border: 1px dashed var(--lm-border-strong);
    border-radius: 6px;
    color: var(--lm-text-tertiary);
    font-size: 12px;
    text-align: center;
  `,
  bookButton: css`
    background: var(--lm-primary);
    border-color: var(--lm-primary);

    &:hover,
    &:focus {
      background: var(--lm-primary) !important;
      border-color: var(--lm-primary) !important;
    }
  `,
}));