import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  'tw:inline-flex tw:shrink-0 tw:items-center tw:justify-center tw:gap-2 tw:whitespace-nowrap tw:rounded-md tw:border tw:border-solid tw:border-transparent tw:text-sm tw:font-medium tw:cursor-pointer tw:transition-colors tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:focus-visible:ring-offset-2 tw:disabled:pointer-events-none tw:disabled:opacity-50 tw:[&_svg]:size-4 tw:[&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'tw:bg-primary tw:text-primary-foreground tw:shadow-sm tw:hover:bg-primary/90',
        outline: 'tw:border-input tw:bg-card tw:text-foreground tw:hover:bg-muted',
        secondary: 'tw:bg-secondary tw:text-secondary-foreground tw:hover:bg-secondary/80',
        ghost: 'tw:bg-transparent tw:text-muted-foreground tw:hover:bg-muted tw:hover:text-foreground',
      },
      size: {
        default: 'tw:h-9 tw:px-4 tw:py-2',
        sm: 'tw:h-8 tw:px-3 tw:text-xs',
        icon: 'tw:size-9 tw:p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({ className, variant, size, asChild = false, type = 'button', ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp data-slot="button" type={type} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button };