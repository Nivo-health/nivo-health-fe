import * as React from 'react';
import * as Label from '@radix-ui/react-label';
import { cn } from '../../utils/cn';

export interface DateFilterProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const DateFilter = React.forwardRef<HTMLInputElement, DateFilterProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `date-filter-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <Label.Root
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </Label.Root>
        )}
        <input
          type="date"
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'ring-offset-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);
DateFilter.displayName = 'DateFilter';

export { DateFilter };
