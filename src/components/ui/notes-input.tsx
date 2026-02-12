'use client';

import * as React from 'react';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { Input } from './input';

export interface NotesInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'list' | 'onChange' | 'value'
> {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  predefinedOptions?: string[];
}

const DEFAULT_OPTIONS = [
  'Before food',
  'After food',
  'With food',
  'Empty stomach',
  'At bedtime',
  'As needed',
  'With meals',
];

export const NotesInput = React.forwardRef<HTMLInputElement, NotesInputProps>(
  function NotesInput(
    {
      className,
      label,
      error,
      id,
      value,
      onChange,
      predefinedOptions = DEFAULT_OPTIONS,
      disabled,
      ...props
    },
    ref,
  ) {
    const inputId =
      id ?? `notes-input-${Math.random().toString(36).slice(2, 9)}`;

    const filteredOptions = React.useMemo(() => {
      if (!value.trim()) return predefinedOptions;

      return predefinedOptions.filter((option) =>
        option.toLowerCase().includes(value.toLowerCase()),
      );
    }, [value, predefinedOptions]);

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <Combobox.Root
          items={filteredOptions}
          inputValue={value}
          onInputValueChange={onChange}
          onValueChange={(option: string | null) => {
            if (option) onChange(option);
          }}
          itemToStringLabel={(item) => item ?? ''}
          disabled={disabled}
        >
          <Combobox.Input
            id={inputId}
            ref={ref}
            render={
              <Input
                {...props}
                className={cn(
                  error && 'border-destructive focus-visible:ring-destructive',
                )}
                nativeInput
              />
            }
          />

          <Combobox.Popup>
            <Combobox.Empty>No suggestions</Combobox.Empty>

            <Combobox.List>
              {filteredOptions.map((option) => (
                <Combobox.Item key={option} value={option}>
                  {option}
                </Combobox.Item>
              ))}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Root>

        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);
