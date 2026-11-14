import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return <input type={type} data-slot="input" className={cn('tw:flex tw:h-9 tw:w-full tw:min-w-0 tw:rounded-md tw:border tw:border-solid tw:border-input tw:bg-card tw:px-3 tw:py-1 tw:text-sm tw:text-foreground tw:placeholder:text-muted-foreground tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring/40 tw:focus-visible:border-ring tw:disabled:cursor-not-allowed tw:disabled:opacity-50', className)} {...props} />;
}

export { Input };