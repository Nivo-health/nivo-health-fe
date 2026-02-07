'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';

import { cn } from '@/lib/utils';

function Root({ className, children, ...props }: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      className={cn('flex w-full flex-col gap-2', className)}
      data-slot="progress"
      {...props}
    >
      {children ? (
        children
      ) : (
        <Track>
          <Indicator />
        </Track>
      )}
    </ProgressPrimitive.Root>
  );
}

function Label({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn('font-medium text-sm', className)}
      data-slot="progress-label"
      {...props}
    />
  );
}

function Track({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        'block h-1.5 w-full overflow-hidden rounded-full bg-input',
        className,
      )}
      data-slot="progress-track"
      {...props}
    />
  );
}

function Indicator({ className, ...props }: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      className={cn('bg-primary transition-all duration-500', className)}
      data-slot="progress-indicator"
      {...props}
    />
  );
}

function Value({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn('text-sm tabular-nums', className)}
      data-slot="progress-value"
      {...props}
    />
  );
}

export const Progress = { Root, Label, Track, Indicator, Value };
