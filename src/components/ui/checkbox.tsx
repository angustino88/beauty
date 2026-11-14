import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root data-slot="checkbox" className={cn('tw:peer tw:size-4 tw:shrink-0 tw:rounded-sm tw:border tw:border-solid tw:border-input tw:bg-card tw:p-0 tw:cursor-pointer tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:disabled:cursor-not-allowed tw:disabled:opacity-50 tw:data-[state=checked]:border-primary tw:data-[state=checked]:bg-primary tw:data-[state=checked]:text-primary-foreground tw:data-[state=indeterminate]:bg-primary tw:data-[state=indeterminate]:text-primary-foreground', className)} {...props}>
      <CheckboxPrimitive.Indicator className="tw:flex tw:items-center tw:justify-center">
        {props.checked === 'indeterminate' ? <Minus className="tw:size-3" /> : <Check className="tw:size-3" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };