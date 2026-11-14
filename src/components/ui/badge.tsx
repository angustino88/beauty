import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

function Badge({ className, ...props }: ComponentProps<'span'>) {
  return <span data-slot="badge" className={cn('tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-md tw:border tw:border-solid tw:border-border tw:bg-muted tw:px-2 tw:py-0.5 tw:text-xs tw:font-medium tw:text-muted-foreground', className)} {...props} />;
}

export { Badge };