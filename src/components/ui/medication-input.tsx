import { useState, useEffect, useRef, useCallback } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Input } from './input';
import {
  medicationService,
  type Medication,
} from '../../services/medicationService';
import { cn } from '@/lib/utils';

export interface MedicationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function MedicationInput({
  value,
  onChange,
  placeholder = 'Search medication...',
  label,
  error,
  className,
  disabled,
}: MedicationInputProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const results = await medicationService.search(query);
      setSuggestions(results);
      if (results.length > 0) {
        setOpen(true);
      } else {
        setOpen(false);
      }
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching medications:', error);
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
    onChange(newValue);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debouncing (500ms delay)
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newValue);
    }, 500);
  };

  // Handle medication selection
  const handleSelectMedication = (medication: Medication) => {
    setSearchQuery(medication.full_name);
    onChange(medication.full_name);
    setOpen(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectMedication(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  // Sync value prop with searchQuery
  useEffect(() => {
    if (value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Popover.Root open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <div className={cn('relative', className)}>
        <Popover.Arrow
          render={
            <div className="relative">
              <label>
                {label}
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setOpen(true);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={disabled}
                  className="w-full"
                />
              </label>
              {/* Loading indicator */}
              {loading && (
                <div className="absolute right-3 top-[2.5rem] text-gray-400">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}
            </div>
          }
        />

        <Popover.Portal>
          <Popover.Positioner align="start" sideOffset={4} collisionPadding={8}>
            <Popover.Popup
              className={cn(
                'z-[9999] w-[var(--radix-popover-trigger-width)] max-h-60 overflow-auto rounded-md border border-teal-200 bg-white shadow-lg',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2',
                'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
              )}
            >
              {suggestions.map((medication, index) => (
                <div
                  key={medication.id}
                  onClick={() => handleSelectMedication(medication)}
                  className={cn(
                    'px-4 py-3 cursor-pointer hover:bg-teal-50 transition-colors',
                    index === selectedIndex && 'bg-teal-50',
                    index === 0 && 'rounded-t-md',
                    index === suggestions.length - 1 && 'rounded-b-md',
                  )}
                >
                  <div className="font-medium text-gray-900">
                    {medication.full_name}
                  </div>
                  {medication.manufacturer && (
                    <div className="text-xs text-gray-500 mt-1">
                      {medication.manufacturer}
                    </div>
                  )}
                </div>
              ))}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}
