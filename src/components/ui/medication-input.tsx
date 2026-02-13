// 'use client';

import * as React from 'react';
import { Combobox } from '@/components/ui/combobox';
import { Input } from './input';
import { medicationService, type Medication } from '../../api/medications.api';
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

const CREATE_ID = '__create__';

export function MedicationInput({
  value,
  onChange,
  placeholder = 'Search medication…',
  label,
  error,
  className,
  disabled,
}: MedicationInputProps) {
  const [query, setQuery] = React.useState(value);
  const [searchResults, setSearchResults] = React.useState<Medication[]>([]);
  const [loading, setLoading] = React.useState(false);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = React.useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const result = await medicationService.search(q);
      setSearchResults(result);
    } catch (e) {
      console.error('Medication search failed', e);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const trimmedQuery = query.trim();
  const hasExactMatch = searchResults.some(
    (m) => m.full_name.toLowerCase() === trimmedQuery.toLowerCase(),
  );

  const items: Medication[] = React.useMemo(() => {
    if (!trimmedQuery || trimmedQuery.length < 2) return searchResults;
    if (hasExactMatch || loading) return searchResults;

    const createItem: Medication = {
      id: CREATE_ID,
      name: trimmedQuery,
      full_name: trimmedQuery,
      generic_name: null,
      manufacturer: '',
    };

    return [...searchResults, createItem];
  }, [searchResults, trimmedQuery, hasExactMatch, loading]);

  const handleInputChange = (
    inputValue: string,
    eventDetails: { reason: string },
  ) => {
    setQuery(inputValue);
    onChange(inputValue);

    // Only trigger API search on actual user typing, not on item selection
    if (eventDetails.reason !== 'input-change') return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(inputValue);
    }, 400);
  };

  React.useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <Combobox.Root<Medication>
        items={items}
        filter={null}
        inputValue={query}
        onInputValueChange={handleInputChange}
        onValueChange={(medication) => {
          if (!medication) return;
          setQuery(medication.full_name);
          onChange(medication.full_name);
        }}
        itemToStringLabel={(item) => item.full_name}
        disabled={disabled}
      >
        <Combobox.Input
          placeholder={placeholder}
          render={
            <Input
              className={cn(
                'w-full',
                error && 'border-destructive focus-visible:ring-destructive',
              )}
              nativeInput
            />
          }
        />

        <Combobox.Popup>
          <Combobox.Status>{loading && 'Searching…'}</Combobox.Status>

          <Combobox.Empty>{!loading && 'No medications found'}</Combobox.Empty>

          <Combobox.List>
            {items.map((med) => (
              <Combobox.Item key={med.id} value={med}>
                {med.id === CREATE_ID ? (
                  <div className="italic text-muted-foreground">
                    Use &ldquo;{med.full_name}&rdquo;
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{med.full_name}</div>
                    {med.manufacturer && (
                      <div className="text-xs text-muted-foreground">
                        {med.manufacturer}
                      </div>
                    )}
                  </div>
                )}
              </Combobox.Item>
            ))}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Root>

      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
