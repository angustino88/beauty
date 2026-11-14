import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card" className={cn('tw:rounded-xl tw:border tw:border-solid tw:border-border tw:bg-card tw:text-card-foreground tw:shadow-xs', className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('tw:p-5', className)} {...props} />;
}

export { Card, CardContent };