'use client';

import { Meter as MeterPrimitive } from '@base-ui/react/meter';

import { cn } from '@/lib/utils';

function Root({ className, children, ...props }: MeterPrimitive.Root.Props) {
  return (
    <MeterPrimitive.Root
      className={cn('flex w-full flex-col gap-2', className)}
      {...props}
    >
      {children ? (
        children
      ) : (
        <Track>
          <Indicator />
        </Track>
      )}
    </MeterPrimitive.Root>
  );
}

function Label({ className, ...props }: MeterPrimitive.Label.Props) {
  return (
    <MeterPrimitive.Label
      className={cn('font-medium text-foreground text-sm', className)}
      data-slot="meter-label"
      {...props}
    />
  );
}

function Track({ className, ...props }: MeterPrimitive.Track.Props) {
  return (
    <MeterPrimitive.Track
      className={cn('block h-2 w-full overflow-hidden bg-input', className)}
      data-slot="meter-track"
      {...props}
    />
  );
}

function Indicator({ className, ...props }: MeterPrimitive.Indicator.Props) {
  return (
    <MeterPrimitive.Indicator
      className={cn('bg-primary transition-all duration-500', className)}
      data-slot="meter-indicator"
      {...props}
    />
  );
}

function Value({ className, ...props }: MeterPrimitive.Value.Props) {
  return (
    <MeterPrimitive.Value
      className={cn('text-foreground text-sm tabular-nums', className)}
      data-slot="meter-value"
      {...props}
    />
  );
}

export const Meter = { Root, Label, Track, Indicator, Value };
