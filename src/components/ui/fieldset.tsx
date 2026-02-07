'use client';

import { Fieldset as FieldsetPrimitive } from '@base-ui/react/fieldset';

import { cn } from '@/lib/utils';

function Root({ className, ...props }: FieldsetPrimitive.Root.Props) {
  return (
    <FieldsetPrimitive.Root
      className={cn('flex w-full flex-col gap-6', className)}
      data-slot="fieldset"
      {...props}
    />
  );
}

function Legend({ className, ...props }: FieldsetPrimitive.Legend.Props) {
  return (
    <FieldsetPrimitive.Legend
      className={cn('font-semibold text-foreground', className)}
      data-slot="fieldset-legend"
      {...props}
    />
  );
}

export const Fieldset = { Root, Legend };
