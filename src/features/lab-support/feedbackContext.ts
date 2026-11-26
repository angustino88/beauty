import type { TicketTypeEnum } from '../../shared/api/generated/api.ts';

export type FeedbackPillKey = 'support' | 'bug' | 'feature' | 'feedback';

export interface FeedbackTypeConfig {
  key: FeedbackPillKey;
  label: string;
  ticketType: TicketTypeEnum;
  subjectPlaceholder: string;
  detailsPlaceholder: string;
  detailsTemplate: string;
  submitLabel: string;
  description: string;
}

export const FEEDBACK_MAX_ATTACHMENTS = 5;

export const CSAT_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'] as const;

export const FEEDBACK_TYPE_CONFIGS: readonly FeedbackTypeConfig[] = [
  {
    key: 'support',
    label: 'Support',
    ticketType: 'service_request',
    subjectPlaceholder: 'Brief summary of what you need help with',
    detailsPlaceholder: "What I need help with:\n\nWhat I've tried:",
    detailsTemplate: "What I need help with:\n\nWhat I've tried:\n",
    submitLabel: 'Submit support request',
    description: 'Get help with lab resources, access, or operational issues',
  },
  {
    key: 'bug',
    label: 'Bug',
    ticketType: 'bug',
    subjectPlaceholder: 'Short summary of the bug or unexpected behavior',
    detailsPlaceholder: 'What happened:\n\nSteps to reproduce:\n\nExpected behavior:',
    detailsTemplate: 'What happened:\n\nSteps to reproduce:\n1. \n2. \n\nExpected behavior:\n',
    submitLabel: 'Submit bug report',
    description: 'Report a software issue or broken screen in Lab Mango',
  },
  {
    key: 'feature',
    label: 'Feature',
    ticketType: 'feature_request',
    subjectPlaceholder: 'Short title for the feature or enhancement',
    detailsPlaceholder: 'What problem does this solve:\n\nProposed feature or workflow:',
    detailsTemplate: 'What problem does this solve:\n\nProposed feature or workflow:\n',
    submitLabel: 'Submit feature request',
    description: 'Suggest a new capability or improvement',
  },
  {
    key: 'feedback',
    label: 'Feedback',
    ticketType: 'feedback',
    subjectPlaceholder: 'Topic of your platform feedback',
    detailsPlaceholder: 'What is working well or could be improved:\n\nSuggestions:',
    detailsTemplate: 'What is working well or could be improved:\n\nSuggestions:\n',
    submitLabel: 'Submit feedback',
    description: 'Share usability, design, or general experience feedback',
  },
] as const;

export function getFeedbackTypeConfig(key: FeedbackPillKey): FeedbackTypeConfig {
  return FEEDBACK_TYPE_CONFIGS.find((item) => item.key === key) ?? FEEDBACK_TYPE_CONFIGS[0];
}

const MAX_PAGE_PATH_LENGTH = 255;
const MAX_CONTEXT_VALUE_LENGTH = 64;

/**
 * Normalizes a browser pathname into a privacy-safe relative route (query & hash stripped).
 */
export function normalizeFeedbackPagePath(rawPath?: string | null): string {
  if (!rawPath) return '';
  const stripped = rawPath.trim().split('#', 1)[0].split('?', 1)[0].trim();
  if (!stripped || stripped.includes('://') || stripped.startsWith('//')) return '';
  if (!stripped.startsWith('/')) return '';
  if (stripped.split('/').includes('..')) return '';
  return stripped.slice(0, MAX_PAGE_PATH_LENGTH);
}

export interface ClientContextInput {
  userAgent?: string;
  innerWidth?: number;
  innerHeight?: number;
  theme?: string;
  language?: string;
  appVersion?: string;
}

export function detectBrowserName(userAgent: string): string {
  const ua = userAgent.trim();
  if (!ua) return '';
  const matchers: Array<[RegExp, string]> = [
    [/Edg\/([\d.]+)/i, 'Edge'],
    [/OPR\/([\d.]+)/i, 'Opera'],
    [/Chrome\/([\d.]+)/i, 'Chrome'],
    [/Firefox\/([\d.]+)/i, 'Firefox'],
    [/Version\/([\d.]+).*Safari/i, 'Safari'],
  ];
  for (const [pattern, name] of matchers) {
    const match = ua.match(pattern);
    if (match) {
      const major = match[1]?.split('.')[0];
      return major ? `${name} ${major}` : name;
    }
  }
  return '';
}

export function detectOsName(userAgent: string): string {
  const ua = userAgent.trim();
  if (!ua) return '';
  if (/Windows NT/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return '';
}

function clampContextValue(value?: string): string {
  if (!value) return '';
  return value.trim().slice(0, MAX_CONTEXT_VALUE_LENGTH);
}

/**
 * Builds a concise, allowlisted client diagnostics dictionary matching backend constraints.
 */
export function buildClientContext(input: ClientContextInput): Record<string, string> {
  const ctx: Record<string, string> = {};
  const browser = clampContextValue(input.userAgent ? detectBrowserName(input.userAgent) : '');
  const os = clampContextValue(input.userAgent ? detectOsName(input.userAgent) : '');
  const viewport =
    typeof input.innerWidth === 'number' &&
    typeof input.innerHeight === 'number' &&
    input.innerWidth > 0 &&
    input.innerHeight > 0
      ? clampContextValue(`${Math.round(input.innerWidth)}x${Math.round(input.innerHeight)}`)
      : '';
  const theme = clampContextValue(input.theme);
  const language = clampContextValue(input.language);
  const appVersion = clampContextValue(input.appVersion);

  if (browser) ctx.browser = browser;
  if (os) ctx.os = os;
  if (viewport) ctx.viewport = viewport;
  if (theme) ctx.theme = theme;
  if (language) ctx.language = language;
  if (appVersion) ctx.app_version = appVersion;
  return ctx;
}

export interface CategoryOptionLike {
  id: number;
  name: string;
  sku?: string | null;
}

/**
 * Mirrors backend resolve_category order: matching code/sku -> general -> first active option.
 */
export function resolveDefaultCategoryId(
  categories: readonly CategoryOptionLike[],
  ticketType: string,
): number | undefined {
  if (categories.length === 0) return undefined;
  const target = ticketType.trim().toLowerCase();
  const byType = categories.find((cat) => (cat.sku ?? '').trim().toLowerCase() === target);
  if (byType) return byType.id;
  const general = categories.find(
    (cat) =>
      (cat.sku ?? '').trim().toLowerCase() === 'general' ||
      cat.name.trim().toLowerCase() === 'general',
  );
  if (general) return general.id;
  return categories[0].id;
}

export interface FileLike {
  name: string;
  size: number;
  lastModified: number;
}

/**
 * Appends incoming files up to maxCount, skipping exact duplicates (name+size+lastModified).
 */
export function mergeAttachmentFiles<T extends FileLike>(
  existing: readonly T[],
  incoming: readonly T[],
  maxCount = FEEDBACK_MAX_ATTACHMENTS,
): { files: T[]; skippedCount: number; duplicateCount: number } {
  const result = [...existing];
  const seen = new Set(existing.map((f) => `${f.name}:${f.size}:${f.lastModified}`));
  let skippedCount = 0;
  let duplicateCount = 0;

  for (const file of incoming) {
    const sig = `${file.name}:${file.size}:${file.lastModified}`;
    if (seen.has(sig)) {
      duplicateCount += 1;
      continue;
    }
    if (result.length >= maxCount) {
      skippedCount += 1;
      continue;
    }
    seen.add(sig);
    result.push(file);
  }
  return { files: result, skippedCount, duplicateCount };
}

export function createIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `fb-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
