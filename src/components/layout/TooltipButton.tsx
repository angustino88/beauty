import { Button, type ButtonProps, Grid, Tooltip, type TooltipProps } from 'antd';

interface TooltipButtonProps extends ButtonProps {
  tooltip: string;
  responsive?: boolean;
  placement?: TooltipProps['placement'];
  /** @deprecated use styles.body — kept as prop name for call-site readability */
  overlayInnerStyle?: React.CSSProperties;
}

export function TooltipButton({
  tooltip,
  responsive,
  placement,
  overlayInnerStyle,
  children,
  ...props
}: TooltipButtonProps) {
  const { lg } = Grid.useBreakpoint();
  const content = responsive && !lg ? null : children;

  return (
    <Tooltip
      placement={placement ?? 'top'}
      title={content ? null : tooltip}
      styles={overlayInnerStyle ? { container: overlayInnerStyle } : undefined}
    >
      <Button {...props}>{content}</Button>
    </Tooltip>
  );
}
