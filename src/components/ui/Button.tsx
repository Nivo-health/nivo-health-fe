import * as React from 'react';
import * as Slot from '@radix-ui/react-slot';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot.Root : 'button';
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium text-sm leading-5',
          'transition-all border',
          'shadow-[0_2px_0_rgba(0,0,0,0.08)] hover:shadow-[0_3px_0_rgba(0,0,0,0.08)] active:shadow-[0_1px_0_rgba(0,0,0,0.12)] active:translate-y-[1px]',
          cn(
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            variant === 'default' &&
              'bg-teal-500 text-white border-teal-600 hover:bg-teal-400 hover:border-teal-500 focus-visible:ring-teal-400',
            variant === 'outline' &&
              'border-teal-400 bg-white text-teal-700 hover:bg-teal-50 hover:border-teal-500 focus-visible:ring-teal-400',
            variant === 'ghost' &&
              'border-teal-200 bg-white/60 text-teal-700 hover:bg-teal-50 hover:border-teal-300 focus-visible:ring-teal-400',
            variant === 'destructive' &&
              'bg-red-500 text-white border-red-600 hover:bg-red-400 hover:border-red-500 focus-visible:ring-red-400',
            size === 'default' && 'h-10 px-4 py-2 text-sm',
            size === 'sm' && 'h-9 px-3 text-xs',
            size === 'lg' && 'h-11 px-5 text-base',
            className,
          ),
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
