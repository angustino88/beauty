import boschLogoUrl from '../../../../assets/logo.png';

type LabelRecord = {
  sku?: string | null;
  name?: string | null;
  serial_number?: string | null;
  lab_name?: string | null;
  location_name?: string | null;
  computer_name?: string | null;
  monitor_name?: string | null;
  accessory_name?: string | null;
  debug_hardware_name?: string | null;
  powersupply_name?: string | null;
  network_interface_name?: string | null;
};

type DeviceLabelMap = Record<string, string>;

// 58 x 24 mm industrial label exported at 4x for sharp print output.
const LABEL_MIN_WIDTH = 348;
const LABEL_HEIGHT = 144;
const LABEL_PIXEL_RATIO = 4;
const LABEL_HEADING_SIZE = '8px';
const LABEL_HEADING_LINE_HEIGHT = '10px';
const LABEL_VALUE_SIZE = '15px';
const LABEL_VALUE_LINE_HEIGHT = '18px';
const LABEL_VALUE_WEIGHT = '800';

const toLabelText = (value: string | null | undefined): string => value || '-';

const resolveDeviceName = (record: LabelRecord): string =>
  toLabelText(
    record.name
      ?? record.computer_name
      ?? record.monitor_name
      ?? record.accessory_name
      ?? record.debug_hardware_name
      ?? record.powersupply_name
      ?? record.network_interface_name
      ?? record.lab_name,
  );

const measureLabelText = (text: string, font: string): number => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return text.length * 9;
  }
  context.font = font;
  return context.measureText(text).width;
};

const getLabelWidth = (hardware: DeviceLabelMap): number => {
  const values = Object.entries(hardware)
    .filter(([label]) => label !== 'SKU' && label !== 'Name')
    .map(([, value]) => value);
  const widestValue = Math.max(
    measureLabelText(hardware.SKU || 'UNASSIGNED', `800 ${LABEL_VALUE_SIZE} Arial`),
    measureLabelText(hardware.Name || 'Unnamed device', `800 ${LABEL_VALUE_SIZE} Arial`),
    ...values.map((value) => measureLabelText(value, `800 ${LABEL_VALUE_SIZE} Arial`)),
  );
  const leftColumnWidth = Math.max(248, Math.ceil(widestValue + 58));
  return Math.max(LABEL_MIN_WIDTH, leftColumnWidth + 100);
};

type QRCodeModule = {
  toString: (
    text: string,
    options: { type: 'svg'; margin: number; errorCorrectionLevel: 'Q'; width: number }
  ) => Promise<string>;
};

const createText = (text: string): HTMLDivElement => {
  const element = document.createElement('div');
  element.textContent = text;
  return element;
};

type LabelIcon = 'device' | 'serial' | 'tag';

const iconPaths: Record<LabelIcon, string> = {
  device: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  serial: '<path d="M4 4v16M8 4v16M13 4v16M17 4v16M21 4v16"/>',
  tag: '<path d="m20 13-7 7L4 11V4h7l9 9Z"/><circle cx="8.5" cy="8.5" r="1.25"/>',
};

const createIcon = (icon: LabelIcon, color: string, size = 14): HTMLSpanElement => {
  const element = document.createElement('span');
  element.style.display = 'inline-flex';
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.flexShrink = '0';
  element.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${iconPaths[icon]}</svg>`;
  return element;
};

const createField = (label: string, value: string, icon: LabelIcon): HTMLDivElement => {
  const field = document.createElement('div');
  field.style.display = 'flex';
  field.style.alignItems = 'stretch';
  field.style.gap = '9px';
  field.style.minWidth = '0';
  field.style.minHeight = '30px';
  field.style.flexShrink = '0';

  const fieldIcon = createIcon(icon, '#000000', 23);
  fieldIcon.style.alignSelf = 'center';
  const fieldContent = document.createElement('div');
  fieldContent.style.minWidth = '0';
  fieldContent.style.flex = '1';

  const fieldLabel = createText(label);
  fieldLabel.style.color = '#000000';
  fieldLabel.style.fontSize = LABEL_HEADING_SIZE;
  fieldLabel.style.fontWeight = '700';
  fieldLabel.style.lineHeight = LABEL_HEADING_LINE_HEIGHT;
  fieldLabel.style.letterSpacing = '0';

  const fieldValue = createText(value);
  fieldValue.title = value;
  fieldValue.style.marginTop = '2px';
  fieldValue.style.overflow = 'hidden';
  fieldValue.style.color = '#000000';
  fieldValue.style.fontSize = LABEL_VALUE_SIZE;
  fieldValue.style.fontWeight = LABEL_VALUE_WEIGHT;
  fieldValue.style.lineHeight = LABEL_VALUE_LINE_HEIGHT;
  fieldValue.style.whiteSpace = 'nowrap';
  fieldValue.style.textOverflow = 'ellipsis';

  fieldContent.appendChild(fieldLabel);
  fieldContent.appendChild(fieldValue);
  field.appendChild(fieldIcon);
  field.appendChild(fieldContent);
  return field;
};

const createBoschLogo = (width: number): HTMLImageElement => {
  const logo = document.createElement('img');
  logo.src = boschLogoUrl;
  logo.alt = 'Bosch';
  logo.style.display = 'block';
  logo.style.width = `${width}px`;
  logo.style.height = `${Math.round(width / 4.25)}px`;
  logo.style.objectFit = 'contain';
  logo.style.filter = 'grayscale(1) brightness(0)';
  return logo;
};

const createLabelCard = async (hardware: DeviceLabelMap, QRCode: QRCodeModule): Promise<HTMLDivElement> => {
  const sku = hardware.SKU || 'UNASSIGNED';
  const name = hardware.Name || 'Unnamed device';
  const details = Object.entries(hardware).filter(([label]) => label !== 'SKU' && label !== 'Name');
  const labelWidth = getLabelWidth(hardware);

  const card = document.createElement('div');
  card.style.width = `${labelWidth}px`;
  card.style.height = `${LABEL_HEIGHT}px`;
  card.style.boxSizing = 'border-box';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.overflow = 'hidden';
  card.style.border = '2px solid #000000';
  card.style.borderRadius = '6px';
  card.style.backgroundColor = '#ffffff';
  card.style.color = '#000000';
  card.style.fontFamily = "Arial, 'Helvetica Neue', sans-serif";
  card.style.fontSynthesis = 'none';

  const body = document.createElement('div');
  body.style.display = 'flex';
  body.style.flex = '1';
  body.style.minHeight = '0';

  const leftColumn = document.createElement('div');
  leftColumn.style.flex = '1';
  leftColumn.style.minWidth = '0';
  leftColumn.style.padding = '7px 10px 7px 11px';
  leftColumn.style.boxSizing = 'border-box';
  leftColumn.style.display = 'flex';
  leftColumn.style.flexDirection = 'column';

  const header = document.createElement('div');
  header.style.height = '25px';
  header.style.display = 'flex';
  header.style.alignItems = 'flex-start';
  header.style.justifyContent = 'space-between';
  header.style.borderBottom = '1px solid #000000';

  const headerLogo = createBoschLogo(76);
  const tagline = createText('Invented for life');
  tagline.style.paddingTop = '3px';
  tagline.style.fontSize = '9px';
  tagline.style.fontWeight = '700';
  tagline.style.lineHeight = '11px';
  tagline.style.color = '#000000';
  tagline.style.whiteSpace = 'nowrap';
  header.appendChild(headerLogo);
  header.appendChild(tagline);
  leftColumn.appendChild(header);

  const identity = document.createElement('div');
  identity.style.display = 'flex';
  identity.style.flex = '1';
  identity.style.flexDirection = 'column';
  identity.style.justifyContent = 'space-between';
  identity.style.paddingTop = '6px';
  identity.style.minWidth = '0';

  const skuLabel = createText('ASSET ID');
  skuLabel.style.color = '#000000';
  skuLabel.style.fontSize = LABEL_HEADING_SIZE;
  skuLabel.style.fontWeight = '700';
  skuLabel.style.lineHeight = LABEL_HEADING_LINE_HEIGHT;
  skuLabel.style.letterSpacing = '0';

  const skuPanel = document.createElement('div');
  skuPanel.style.display = 'flex';
  skuPanel.style.alignItems = 'center';
  skuPanel.style.gap = '0';
  skuPanel.style.marginTop = '1px';
  skuPanel.style.padding = '0';
  skuPanel.style.boxSizing = 'border-box';
  skuPanel.style.overflow = 'visible';
  skuPanel.style.border = '0';
  skuPanel.style.borderRadius = '0';
  skuPanel.style.backgroundColor = '#ffffff';

  const skuValue = createText(sku);
  skuValue.title = sku;
  skuValue.style.width = '100%';
  skuValue.style.minWidth = '0';
  skuValue.style.overflow = 'visible';
  skuValue.style.color = '#000000';
  skuValue.style.fontSize = LABEL_VALUE_SIZE;
  skuValue.style.fontWeight = LABEL_VALUE_WEIGHT;
  skuValue.style.lineHeight = LABEL_VALUE_LINE_HEIGHT;
  skuValue.style.letterSpacing = '0';
  skuValue.style.whiteSpace = 'nowrap';
  skuValue.style.textOverflow = 'clip';
  skuPanel.appendChild(skuValue);

  const assetSection = document.createElement('div');
  assetSection.style.display = 'flex';
  assetSection.style.alignItems = 'stretch';
  assetSection.style.flexShrink = '0';
  assetSection.style.gap = '9px';
  assetSection.style.padding = '1px 5px';
  assetSection.style.borderRadius = '5px';
  assetSection.style.backgroundColor = '#ffffff';

  const assetIcon = createIcon('tag', '#000000', 23);
  assetIcon.style.alignSelf = 'center';
  const assetContent = document.createElement('div');
  assetContent.style.flex = '1';
  assetContent.style.minWidth = '0';
  assetContent.appendChild(skuLabel);
  assetContent.appendChild(skuPanel);
  assetSection.appendChild(assetIcon);
  assetSection.appendChild(assetContent);

  identity.appendChild(assetSection);
  const nameField = createField('DEVICE NAME', name, 'device');
  nameField.style.paddingLeft = '5px';
  identity.appendChild(nameField);

  const detailArea = document.createElement('div');
  detailArea.style.flexShrink = '0';
  detailArea.style.paddingLeft = '5px';
  for (const [label, value] of details.slice(0, 2)) {
    const detailField = createField(label.toUpperCase(), value, 'serial');
    detailField.style.marginTop = detailArea.childElementCount === 0 ? '0' : '2px';
    detailArea.appendChild(detailField);
  }
  identity.appendChild(detailArea);
  leftColumn.appendChild(identity);

  const scanZone = document.createElement('div');
  scanZone.style.width = '100px';
  scanZone.style.boxSizing = 'border-box';
  scanZone.style.padding = '7px';
  scanZone.style.display = 'flex';
  scanZone.style.flexDirection = 'column';
  scanZone.style.alignItems = 'center';
  scanZone.style.justifyContent = 'center';
  scanZone.style.borderLeft = '2px solid #000000';
  scanZone.style.backgroundColor = '#ffffff';

  const scanBrand = createBoschLogo(68);
  scanBrand.style.marginBottom = '5px';
  scanZone.appendChild(scanBrand);

  const qrSvgString = await QRCode.toString(sku, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'Q',
    width: 84,
  });
  const qrWrapper = document.createElement('div');
  qrWrapper.style.width = '84px';
  qrWrapper.style.height = '84px';
  qrWrapper.style.flexShrink = '0';
  qrWrapper.style.backgroundColor = '#ffffff';
  qrWrapper.style.border = '0';
  qrWrapper.style.padding = '0';
  qrWrapper.style.boxSizing = 'border-box';
  qrWrapper.innerHTML = qrSvgString;

  scanZone.appendChild(qrWrapper);

  body.appendChild(leftColumn);
  body.appendChild(scanZone);
  card.appendChild(body);
  return card;
};

const triggerDownload = (dataUrl: string, fileName: string): void => {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
};

const exportLabel = async (hardware: DeviceLabelMap, fileName: string): Promise<void> => {
  const [{ toPng }, { default: QRCode }] = await Promise.all([
    import('html-to-image'),
    import('qrcode'),
  ]);
  const mountNode = document.createElement('div');
  mountNode.style.position = 'fixed';
  mountNode.style.top = '-10000px';
  mountNode.style.left = '-10000px';
  mountNode.style.zIndex = '-1';
  mountNode.style.pointerEvents = 'none';
  document.body.appendChild(mountNode);
  try {
    const card = await createLabelCard(hardware, QRCode);
    mountNode.appendChild(card);
    const dataUrl = await toPng(card, {
      cacheBust: true,
      pixelRatio: LABEL_PIXEL_RATIO,
      backgroundColor: '#ffffff',
      skipFonts: true,
      fontEmbedCSS: '',
    });
    triggerDownload(dataUrl, fileName);
  } finally {
    document.body.removeChild(mountNode);
  }
};

export function printDeviceLabel(record: LabelRecord): void {
  const data: DeviceLabelMap = {
    SKU: toLabelText(record.sku),
    Name: resolveDeviceName(record),
    'Serial No': toLabelText(record.serial_number),
  };
  void exportLabel(data, `${toLabelText(record.sku)}.png`);
}

export function printLabInfoLabel(record: LabelRecord): void {
  const data: DeviceLabelMap = {
    SKU: toLabelText(record.sku),
    Name: toLabelText(record.lab_name),
    Location: toLabelText(record.location_name),
  };
  void exportLabel(data, `${toLabelText(record.sku)}.png`);
}
