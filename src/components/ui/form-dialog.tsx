import { useCallback, useRef, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { LoaderCircle } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';

interface FormDialogProps {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  submitDisabled?: boolean;
  wide?: boolean;
  className?: string;
  destructive?: boolean;
}

/** Compatibility boundary: only the shell changes, not Ant Form validation.
 * Mount popups on an in-dialog host (outside overflow:hidden labels and the scroll body, but inside Radix's focus scope). */
export function FormDialog({ open, title, description, children, onCancel, onSubmit, submitLabel, cancelLabel = 'Cancel', busy = false, submitDisabled, wide, className, destructive }: FormDialogProps) {
  const overlayHost = useRef<HTMLDivElement>(null);
  const getPopupContainer = useCallback(
    (trigger?: HTMLElement) =>
      overlayHost.current ??
      trigger?.closest<HTMLElement>('[data-slot="dialog-content"]') ??
      document.body,
    [],
  );

  return <Dialog open={open} onOpenChange={(next) => { if (!next && !busy) onCancel(); }}>
    <DialogContent className={`${wide ? 'tw:max-w-[820px]' : 'tw:max-w-[640px]'} ${className ?? ''}`} closeDisabled={busy} onPointerDownOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => {
      // Radix captures Escape before Ant's popup handlers. Let an open
      // select/date picker consume it without discarding the enclosing form.
      const target = event.target as HTMLElement;
      const content = target.closest('[data-slot="dialog-content"]');
      const popupOpen = Array.from(content?.querySelectorAll('.ant-select-dropdown, .ant-picker-dropdown') ?? [])
        .some((popup) => popup.getClientRects().length > 0 && getComputedStyle(popup).visibility !== 'hidden');
      if (busy || popupOpen) event.preventDefault();
    }}>
      <header className="tw:border-0 tw:border-b tw:border-solid tw:border-border tw:px-6 tw:py-5 tw:pr-14">
        <DialogTitle className="tw:m-0 tw:text-lg tw:font-semibold tw:tracking-tight">{title}</DialogTitle>
        <DialogDescription className="tw:mt-1 tw:text-xs tw:text-muted-foreground">{description}</DialogDescription>
      </header>
      <ConfigProvider getPopupContainer={getPopupContainer}>
        <div className="tw:min-h-0 tw:overflow-y-auto tw:px-6 tw:py-5" aria-busy={busy}>{children}</div>
      </ConfigProvider>
      <footer className="tw:flex tw:shrink-0 tw:items-center tw:justify-end tw:gap-2 tw:border-0 tw:border-t tw:border-solid tw:border-border tw:bg-muted/50 tw:px-6 tw:py-4">
        <Button variant="outline" disabled={busy} onClick={onCancel}>{cancelLabel}</Button>
        <Button disabled={busy || submitDisabled} onClick={onSubmit} className={destructive ? 'tw:bg-destructive tw:hover:bg-destructive/90' : undefined}>
          {busy && <LoaderCircle className="tw:animate-spin tw:motion-reduce:animate-none" />}{submitLabel}
        </Button>
      </footer>
      <div ref={overlayHost} />
    </DialogContent>
  </Dialog>;
}