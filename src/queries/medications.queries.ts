import { useQuery, queryOptions } from '@tanstack/react-query';
import { medicationService } from '../api/medications.api';
import { queryKeys } from './queryKeys';

export const medicationQueryOptions = {
  search: (query: string) =>
    queryOptions({
      queryKey: queryKeys.medications(query),
      queryFn: () => medicationService.search(query),
      enabled: query.trim().length >= 2,
      staleTime: 1000 * 60 * 5, // 5 minutes - medication data rarely changes
    }),
};

export function useMedicationSearch(query: string) {
  return useQuery(medicationQueryOptions.search(query));
}
