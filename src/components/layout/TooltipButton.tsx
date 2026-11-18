import { Button, type ButtonProps, Grid, Tooltip, type TooltipProps } from 'antd';

interface TooltipButtonProps extends ButtonProps {
  /**
   * What the button does: a verb and its object in sentence case ("Book BENCH-02", "Export tickets
   * to Excel"). Shown on hover when the button has no visible label, and used as its accessible name.
   */
  tooltip: string;
  /** Why the button is disabled ("No computer is mapped to this bench"). Shown on hover while disabled, label or not. */
  disabledReason?: string;
  responsive?: boolean;
  placement?: TooltipProps['placement'];
  /** @deprecated use styles.body — kept as prop name for call-site readability */
  overlayInnerStyle?: React.CSSProperties;
}

export function TooltipButton({
  tooltip,
  disabledReason,
  responsive,
  placement,
  overlayInnerStyle,
  children,
  ...props
}: TooltipButtonProps) {
  const { lg } = Grid.useBreakpoint();
  const content = responsive && !lg ? null : children;
  // A visible label already says what the button does; a disabled button still needs to say why.
  const title = props.disabled && disabledReason ? disabledReason : content ? null : tooltip;

  return (
    <Tooltip
      placement={placement ?? 'top'}
      title={title}
      mouseEnterDelay={0.3}
      styles={overlayInnerStyle ? { container: overlayInnerStyle } : undefined}
    >
      <Button aria-label={content ? undefined : tooltip} {...props}>{content}</Button>
    </Tooltip>
  );
}
