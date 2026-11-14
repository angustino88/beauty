import type { ComponentProps } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

function SheetContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="tw:fixed tw:inset-0 tw:z-[1000] tw:bg-slate-950/35 tw:backdrop-blur-[2px]" />
    <DialogPrimitive.Content data-slot="sheet-content" className={cn('tw:fixed tw:inset-y-0 tw:right-0 tw:z-[1001] tw:flex tw:w-full tw:max-w-[760px] tw:flex-col tw:border-0 tw:border-l tw:border-solid tw:border-border tw:bg-card tw:text-foreground tw:shadow-xl tw:outline-none', className)} {...props}>
      {children}
      <DialogPrimitive.Close aria-label="Close details" className="tw:absolute tw:right-5 tw:top-5 tw:flex tw:size-8 tw:items-center tw:justify-center tw:rounded-md tw:border-0 tw:bg-muted tw:text-muted-foreground tw:cursor-pointer tw:hover:bg-secondary tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring"><X className="tw:size-4" /></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}

export { Sheet, SheetContent, SheetTitle, SheetDescription };