import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn('tw:animate-pulse tw:motion-reduce:animate-none tw:rounded-md tw:bg-border', className)} {...props} />;
}

export { Skeleton };