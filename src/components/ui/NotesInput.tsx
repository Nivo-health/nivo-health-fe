import * as React from 'react';
import * as Label from '@radix-ui/react-label';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';

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
            <Label.Root
              htmlFor={inputId}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {label}
            </Label.Root>
          )}
          <Popover.Anchor asChild>
            <div className="relative">
              <input
                type="text"
                id={inputId}
                ref={inputRef}
                value={value}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleInputKeyDown}
                className={cn(
                  'flex h-10 w-full rounded-md border border-teal-300 bg-white px-3 py-2 text-sm',
                  'ring-offset-white placeholder:text-gray-400',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  error && 'border-red-500 focus-visible:ring-red-500',
                  className,
                )}
                {...props}
              />
            </div>
          </Popover.Anchor>

          <Popover.Portal>
            <Popover.Content
              className={cn(
                'z-[9999] w-[var(--radix-popover-trigger-width)] max-h-48 overflow-auto rounded-md border border-teal-200 bg-white shadow-lg',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
                'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
              )}
              align="start"
              sideOffset={4}
              collisionPadding={8}
            >
              {filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-teal-50 focus:bg-teal-50 focus:outline-none transition-colors',
                    index === selectedIndex && 'bg-teal-50',
                    index === 0 && 'rounded-t-md',
                    index === filteredOptions.length - 1 && 'rounded-b-md',
                  )}
                >
                  {option}
                </button>
              ))}
            </Popover.Content>
          </Popover.Portal>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </Popover.Root>
    );
  },
);
NotesInput.displayName = 'NotesInput';

export { NotesInput };
