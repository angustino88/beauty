/**
 * Small filled person mark for owner / creator tags: a silhouette on a tinted
 * disc in the brand accent. Replaces the bust emoji, which each OS drew in its
 * own colour and which sank on dark surfaces.
 */
export function PersonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden="true"
      style={{ flex: '0 0 auto', marginRight: 6, verticalAlign: '-0.25em' }}
    >
      <circle cx="10" cy="10" r="10" fill="var(--lm-primary-bg)" />
      <circle cx="10" cy="10" r="9.5" fill="none" stroke="var(--lm-primary-border)" />
      <circle cx="10" cy="7.6" r="3.3" fill="var(--lm-primary-fg)" />
      <path d="M3.9 16.6a6.2 6.2 0 0 1 12.2 0A9.4 9.4 0 0 1 10 19a9.4 9.4 0 0 1-6.1-2.4Z" fill="var(--lm-primary-fg)" />
    </svg>
  );
}
