import { createStyles } from 'antd-style';

export const useInfoModalStyles = createStyles(({ css }) => ({
  modalContent: css`
    display: grid;
    gap: 16px;
    width: 100%;
    min-width: 0;
    padding: 2px 2px 2px 0;
    color: #263a32;
  `,
  deviceHero: css`
    display: grid;
    grid-template-columns: 164px minmax(0, 1fr);
    min-height: 176px;
    overflow: hidden;
    border: 1px solid #d8e3dd;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(226, 240, 232, 0.72), transparent 52%), #fbfcfa;

    @media (max-width: 640px) { grid-template-columns: 1fr; }
  `,
  deviceVisual: css`
    position: relative;
    display: grid;
    min-height: 176px;
    place-items: center;
    overflow: hidden;
    background: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px), #214b3d;
    background-size: 18px 18px;

    .ant-image, .ant-image-img { width: 100%; height: 100%; min-height: 176px; }
    .ant-image-img { object-fit: cover; }
  `,
  deviceFallback: css`
    display: grid;
    gap: 12px;
    place-items: center;
    color: rgba(255,255,255,.9);
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
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 4px;
    background: rgba(12,32,25,.78);
    color: rgba(255,255,255,.88);
    font-family: Consolas, monospace;
    font-size: 10px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  deviceIdentity: css`
    min-width: 0;
    padding: 18px 20px;
    h3.ant-typography { margin: 2px 0 0; color: #1d342b; font-size: 24px; line-height: 1.2; letter-spacing: 0; }

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
    border: 1px solid #d6e1db;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.76);
    > span { padding-right: 10px; border-right: 1px solid #dce5e0; color: #718078; font-size: 10px; font-weight: 700; line-height: 1.3; text-transform: uppercase; }
    > strong { display: flex; align-items: center; gap: 9px; color: #315e4c; font-size: 14px; font-weight: 800; line-height: 1.3; }
    > strong small { color: #718078; font-size: 10px; font-weight: 600; white-space: nowrap; }
    &[data-status='active'] {
      > strong { color: #8d3b34; }
    }
    &[data-status='inactive'] {
      > strong { color: #8a651f; }
    }
    &[data-status='offline'], &[data-status='unknown'] {
      > strong { color: #625b58; }
    }
    &[data-status='maintaining'], &[data-status='maintenance'] {
      > strong { color: #176d78; }
    }

    @media (max-width: 480px) {
      width: 100%;
      justify-content: space-between;
    }
  `,
  bookingStatus: css`
    display: block;
    width: 10px;
    height: 10px;
    flex: 0 0 10px;
    border-radius: 50%;
  `,
  bookingStatusBooked: css`
    background: #a13a30;
    box-shadow: 0 0 0 3px rgba(161, 58, 48, 0.12);
  `,
  bookingStatusAvailable: css`
    background: #3e8761;
    box-shadow: 0 0 0 3px rgba(62, 135, 97, 0.12);
  `,
  eyebrow: css`
    color: #3f765f;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  `,
  quickFacts: css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid #dce5e0;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.68);
    > div { display: flex; min-width: 0; align-items: center; gap: 10px; padding: 10px 12px; color: #39715a; font-size: 15px; }
    > div:nth-child(odd) { border-right: 1px solid #e3eae6; }
    > div:nth-child(-n + 2) { border-bottom: 1px solid #e3eae6; }
    span, strong { display: block; min-width: 0; }
    span { color: #66756d; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    strong { overflow: hidden; margin-top: 3px; color: #263a32; font-size: 14px; line-height: 1.35; text-overflow: ellipsis; text-transform: none; }
    a { color: #247056; text-decoration: underline; text-underline-offset: 2px; }
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
      > div:nth-child(odd) { border-right: 0; }
      > div:not(:last-child) { border-bottom: 1px solid #e3eae6; }
    }
  `,
  remark: css`
    margin-top: 12px;
    padding: 7px 10px;
    border-left: 3px solid #83a996;
    background: rgba(225,237,230,.55);
    color: #58675f;
    font-size: 12px;
    line-height: 1.45;
  `,
  activityStrip: css`
    padding: 14px 16px 16px;
    border: 1px solid #d8e3dd;
    border-radius: 8px;
    background: #f8faf8;
  `,
  sectionHeading: css`
    display: flex;
    align-items: center;
    gap: 10px;
    div { display: grid; gap: 1px; }
    strong { color: #263a32; font-size: 15px; line-height: 1.3; }
    div > span { color: #707d76; font-size: 11px; line-height: 1.35; }
  `,
  headingIcon: css`
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border-radius: 6px;
    background: #dfece5;
    color: #2f7458;
    font-size: 15px;
  `,
  activityFlow: css`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    margin-top: 12px;
    overflow: hidden;
    border: 1px solid #dfe7e2;
    border-radius: 6px;
    background: #fff;
    > div { display: grid; grid-template-columns: 30px minmax(0, 1fr); min-width: 0; min-height: 64px; align-items: center; gap: 10px; padding: 12px 14px; color: #4e806b; }
    > div > .anticon { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 5px; background: #edf4f0; font-size: 15px; }
    > div:nth-of-type(2), > div:nth-of-type(3) { border-left: 1px solid #e4eae7; }
    span, strong { display: block; min-width: 0; }
    div > span { width: 100%; color: #6d7b74; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    strong { overflow: hidden; margin-top: 4px; color: #283b33; font-size: 14px; line-height: 1.35; text-overflow: ellipsis; text-transform: none; white-space: nowrap; }
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
      > div:nth-of-type(2), > div:nth-of-type(3) { border-top: 1px solid #e4eae7; border-left: 0; }
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
    border: 1px solid #d8e3dd;
    border-radius: 8px;
    background: #fff;
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
    color: #748079;
    font-size: 9px;
    text-transform: uppercase;
    strong { color: #2c624d; font-size: 22px; font-variant-numeric: tabular-nums; }
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
    border: 1px solid #e1e8e4;
    border-radius: 6px;
    background: #f9fbf9;
  `,
  equipmentGroupHeader: css`
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 10px;
    border-bottom: 1px solid #e5ebe8;
  `,
  equipmentIcon: css`
    display: grid;
    width: 25px;
    height: 25px;
    flex: 0 0 25px;
    place-items: center;
    border-radius: 5px;
    background: #e0ece6;
    color: #347258;
    font-size: 13px;
  `,
  equipmentLabel: css`
    overflow: hidden;
    color: #34473f;
    font-size: 11px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  equipmentCount: css`
    margin-left: auto;
    color: #718078;
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
    background: #fff;
    color: #2c3e36;
    font-size: 12px;
    font-weight: 700;
  `,
  equipmentMeta: css`
    display: block;
    overflow: hidden;
    margin-top: 3px;
    color: #77827d;
    font-family: Consolas, monospace;
    font-size: 9px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  emptyInventory: css`
    padding: 24px;
    border: 1px dashed #d7dfdb;
    border-radius: 6px;
    color: #8a948f;
    font-size: 12px;
    text-align: center;
  `,
  bookButton: css`
    background: #1F7A4D;
    border-color: #1F7A4D;

    &:hover,
    &:focus {
      background: #1F7A4D !important;
      border-color: #1F7A4D !important;
    }
  `,
}));