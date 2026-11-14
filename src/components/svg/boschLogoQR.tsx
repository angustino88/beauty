import React from "react";

interface LogoBoschQRProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

// Neutral placeholder: the corporate logo is not distributed in this public repo.
export const LogoBoschQR: React.FC<LogoBoschQRProps> = ({
  width = 250,
  height = 53,
  className,
  style,
  ariaLabel = "Logo",
}) => (
  <svg viewBox="0 0 250 53" width={width} height={height} className={className} style={style} role="img" aria-label={ariaLabel}>
    <circle cx="26" cy="26.5" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
    <rect x="60" y="17" width="180" height="19" rx="4" fill="currentColor" />
  </svg>
);
