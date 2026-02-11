import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

/**
 * Hook to read URL query parameters
 */
export function useQueryParams() {
  const location = useLocation();

  const query = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  const get = useCallback(
    (key: string): string | null => {
      return query.get(key);
    },
    [query],
  );

  const getAll = useCallback(
    (key: string): string[] => {
      return query.getAll(key);
    },
    [query],
  );

  const has = useCallback(
    (key: string): boolean => {
      return query.has(key);
    },
    [query],
  );

  return { query, get, getAll, has };
}

interface UpdateQueryEntry {
  query: string;
  value: string | number | boolean | null | undefined;
}

/**
 * Hook to update URL query parameters
 */
export function useUpdateQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const update = useCallback(
    ({ query, value }: UpdateQueryEntry) => {
      const newParams = new URLSearchParams(searchParams);

      if (value === null || value === undefined || value === '') {
        newParams.delete(query);
      } else {
        newParams.set(query, String(value));
      }

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const updateMultiple = useCallback(
    (entries: UpdateQueryEntry[]) => {
      const newParams = new URLSearchParams(searchParams);

      entries.forEach(({ query, value }) => {
        if (value === null || value === undefined || value === '') {
          newParams.delete(query);
        } else {
          newParams.set(query, String(value));
        }
      });

      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clear = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { update, updateMultiple, clear };
}
