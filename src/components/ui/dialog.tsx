import type { ComponentProps } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

function DialogContent({ className, children, closeDisabled = false, ...props }: ComponentProps<typeof DialogPrimitive.Content> & { closeDisabled?: boolean }) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="tw:fixed tw:inset-0 tw:z-[1000] tw:bg-slate-950/35 tw:backdrop-blur-[2px]" />
    <DialogPrimitive.Content data-slot="dialog-content" className={cn('tw:fixed tw:left-1/2 tw:top-1/2 tw:z-[1001] tw:flex tw:max-h-[90dvh] tw:w-[calc(100%-2rem)] tw:max-w-xl tw:-translate-x-1/2 tw:-translate-y-1/2 tw:flex-col tw:rounded-xl tw:border tw:border-solid tw:border-border tw:bg-card tw:text-foreground tw:shadow-xl tw:outline-none', className)} {...props}>
      {children}
      <DialogPrimitive.Close disabled={closeDisabled} aria-label="Close dialog" className="tw:absolute tw:right-4 tw:top-4 tw:flex tw:size-7 tw:items-center tw:justify-center tw:rounded-md tw:border-0 tw:bg-transparent tw:text-muted-foreground tw:cursor-pointer tw:hover:bg-muted tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:disabled:opacity-50"><X className="tw:size-4" /></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}

export { Dialog, DialogContent, DialogTitle, DialogDescription };