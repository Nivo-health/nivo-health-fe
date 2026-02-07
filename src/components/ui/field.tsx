'use client';

import { Field as FieldPrimitive } from '@base-ui/react/field';

import { cn } from '@/lib/utils';

function Root({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root
      className={cn('flex flex-col items-start gap-2', className)}
      data-slot="field"
      {...props}
    />
  );
}

function Label({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      className={cn(
        'inline-flex items-center gap-2 font-medium text-base/4.5 text-foreground sm:text-sm/4',
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

function Item({
  className,
  block = false,
  ...props
}: FieldPrimitive.Item.Props & {
  block?: boolean;
}) {
  return (
    <FieldPrimitive.Item
      className={cn('flex', className, { 'w-full': block })}
      data-slot="field-item"
      {...props}
    />
  );
}

function Description({
  className,
  ...props
}: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      className={cn('text-muted-foreground text-xs', className)}
      data-slot="field-description"
      {...props}
    />
  );
}

function Error({ className, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      className={cn('text-destructive-foreground text-xs', className)}
      data-slot="field-error"
      {...props}
    />
  );
}

const Control = FieldPrimitive.Control;
const Validity = FieldPrimitive.Validity;

export const Field = {
  Root,
  Label,
  Description,
  Error,
  Control,
  Item,
  Validity,
};
