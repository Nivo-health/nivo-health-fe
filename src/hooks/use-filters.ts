import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryParams, useUpdateQueryParams } from './use-query-params';

export type UpdateFilterFn<T> = <K extends keyof T>(
  name: K,
  value: T[K],
) => void;

export type ResetFiltersFn = () => void;

export interface UseFiltersOptions<T> {
  /** Initial filter values */
  initialValue: T;
  /** Sync filters with URL query params */
  useQueryParams?: boolean;
}

export interface UseFiltersReturn<T> {
  /** Current filter values */
  values: T;
  /** Update a single filter */
  updateFilter: UpdateFilterFn<T>;
  /** Get a callback for updating a specific filter (useful for passing to components) */
  getUpdateFilter: <K extends keyof T>(name: K) => (value: T[K]) => void;
  /** Reset all filters to initial values */
  resetFilters: ResetFiltersFn;
  /** Check if any filter has changed from initial */
  hasActiveFilters: boolean;
  updateMultipleFilters: (updates: Partial<T>) => void;
}

/**
 * Hook for managing filter state with optional URL query param sync
 *
 * @example
 * ```tsx
 * const { values, updateFilter, resetFilters } = useFilters({
 *   initialValue: {
 *     search: '',
 *     status: 'all',
 *     page: 1,
 *     limit: 10,
 *   },
 *   useQueryParams: true,
 * });
 *
 * // Update single filter
 * updateFilter('search', 'john');
 *
 * // Get callback for a filter (useful for passing to child components)
 * <SearchInput onChange={getUpdateFilter('search')} />
 * ```
 */
export function useFilters<T extends Record<string, unknown>>({
  initialValue,
  useQueryParams: syncWithUrl = false,
}: UseFiltersOptions<T>): UseFiltersReturn<T> {
  const [localValues, setLocalValues] = useState<T>(initialValue);
  const { get: getQueryParam } = useQueryParams();
  const { update, updateMultiple } = useUpdateQueryParams();

  // Memoize initial value to prevent unnecessary effects
  const initialValueJSON = useMemo(
    () => JSON.stringify(initialValue),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Initialize URL params on mount if syncWithUrl is true
  useEffect(() => {
    if (!syncWithUrl) return;

    const entries = Object.entries(initialValue)
      .map(([key, defaultValue]) => {
        const urlValue = getQueryParam(key);
        const value = urlValue ?? defaultValue;
        return {
          query: key,
          value:
            value === null || value === undefined
              ? null
              : Array.isArray(value)
                ? value.join(',')
                : String(value),
        };
      })
      .filter((entry) => entry.value !== null);

    updateMultiple(entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValueJSON, syncWithUrl]);

  // Compute values from URL or local state
  const values = useMemo(() => {
    if (!syncWithUrl) {
      return localValues;
    }

    return Object.keys(initialValue).reduce((acc, key) => {
      const queryValue = getQueryParam(key);
      const defaultValue = initialValue[key as keyof T];

      if (queryValue === null) {
        acc[key as keyof T] = defaultValue;
      } else if (Array.isArray(defaultValue)) {
        // Handle array values (comma-separated in URL)
        acc[key as keyof T] = queryValue.split(',') as T[keyof T];
      } else if (typeof defaultValue === 'number') {
        // Handle numeric values
        acc[key as keyof T] = Number(queryValue) as T[keyof T];
      } else if (typeof defaultValue === 'boolean') {
        // Handle boolean values
        acc[key as keyof T] = (queryValue === 'true') as T[keyof T];
      } else {
        // Handle string values
        acc[key as keyof T] = queryValue as T[keyof T];
      }

      return acc;
    }, {} as T);
  }, [syncWithUrl, localValues, getQueryParam, initialValue]);

  // Update a single filter
  const updateFilter = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      if (syncWithUrl) {
        const urlValue = Array.isArray(value)
          ? value.join(',')
          : value === null || value === undefined
            ? null
            : String(value);

        update({ query: String(name), value: urlValue });
      }

      setLocalValues((prev) => ({ ...prev, [name]: value }));
    },
    [syncWithUrl, update],
  );

  // Get a callback for updating a specific filter
  const getUpdateFilter = useCallback(
    <K extends keyof T>(name: K) =>
      (value: T[K]) => {
        updateFilter(name, value);
      },
    [updateFilter],
  );

  // Reset all filters to initial values
  const resetFilters = useCallback(() => {
    setLocalValues(JSON.parse(initialValueJSON) as T);

    if (syncWithUrl) {
      const entries = Object.entries(JSON.parse(initialValueJSON) as T).map(
        ([key, value]) => ({
          query: key,
          value: value as string | number | boolean | null,
        }),
      );
      updateMultiple(entries);
    }
  }, [initialValueJSON, syncWithUrl, updateMultiple]);

  // Check if any filter has changed from initial
  const hasActiveFilters = useMemo(() => {
    const initial = JSON.parse(initialValueJSON) as T;
    return Object.keys(initial).some((key) => {
      const initialVal = initial[key as keyof T];
      const currentVal = values[key as keyof T];

      if (Array.isArray(initialVal) && Array.isArray(currentVal)) {
        return JSON.stringify(initialVal) !== JSON.stringify(currentVal);
      }

      return initialVal !== currentVal;
    });
  }, [initialValueJSON, values]);

  // Update multiple filters at once
  const updateMultipleFilters = useCallback(
    (updates: Partial<T>) => {
      if (syncWithUrl) {
        const entries = Object.entries(updates).map(([key, value]) => ({
          query: key,
          value: Array.isArray(value)
            ? value.join(',')
            : value === null || value === undefined
              ? null
              : String(value),
        }));

        updateMultiple(entries);
      }

      setLocalValues((prev) => ({ ...prev, ...updates }));
    },
    [syncWithUrl, updateMultiple],
  );

  return {
    values,
    updateFilter,
    updateMultipleFilters,
    getUpdateFilter,
    resetFilters,
    hasActiveFilters,
  };
}
