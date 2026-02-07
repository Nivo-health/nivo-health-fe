import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { cn } from '@/lib/utils';
import { Input } from './input';

export interface NotesInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'list' | 'onChange'
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

const NotesInput = React.forwardRef<HTMLInputElement, NotesInputProps>(
  (
    {
      className,
      label,
      error,
      id,
      value,
      onChange,
      predefinedOptions = DEFAULT_OPTIONS,
      ...props
    },
    ref,
  ) => {
    const inputId =
      id || `notes-input-${Math.random().toString(36).substr(2, 9)}`;
    const [open, setOpen] = React.useState(false);
    const [filteredOptions, setFilteredOptions] =
      React.useState<string[]>(predefinedOptions);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    React.useEffect(() => {
      // Filter options based on input value
      if (value.trim() === '') {
        setFilteredOptions(predefinedOptions);
      } else {
        const filtered = predefinedOptions.filter((option) =>
          option.toLowerCase().includes(value.toLowerCase()),
        );
        setFilteredOptions(filtered);
      }
    }, [value, predefinedOptions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      if (e.target.value.trim() !== '') {
        setOpen(true);
      }
    };

    const handleSelectOption = (option: string) => {
      onChange(option);
      setOpen(false);
      inputRef.current?.blur();
    };

    const handleInputFocus = () => {
      if (filteredOptions.length > 0) {
        setOpen(true);
      }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || filteredOptions.length === 0) {
        if (e.key === 'Escape') {
          setOpen(false);
          inputRef.current?.blur();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
            handleSelectOption(filteredOptions[selectedIndex]);
          } else if (filteredOptions.length > 0) {
            handleSelectOption(filteredOptions[0]);
          }
          break;
        case 'Escape':
          setOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    return (
      <Popover.Root
        open={open && filteredOptions.length > 0}
        onOpenChange={setOpen}
      >
        <div className="w-full relative">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {label}
            </label>
          )}

          <Popover.Trigger
            render={
              <Input
                type="text"
                id={inputId}
                ref={inputRef}
                value={value}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleInputKeyDown}
                {...props}
              />
            }
          ></Popover.Trigger>

          <Popover.Portal>
            <Popover.Positioner
              align="start"
              sideOffset={4}
              collisionPadding={8}
            >
              <Popover.Popup
                className={cn(
                  'w-[--popover-trigger-width]',
                  'max-h-48 overflow-auto rounded-md border bg-white shadow-lg',
                )}
              >
                {filteredOptions.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-teal-50',
                      index === selectedIndex && 'bg-teal-50',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </Popover.Root>
    );
  },
);
NotesInput.displayName = 'NotesInput';

export { NotesInput };
