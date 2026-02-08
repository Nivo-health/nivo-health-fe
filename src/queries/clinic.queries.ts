import { useQuery, queryOptions } from '@tanstack/react-query';
import { clinicService } from '../api/clinic.api';
import type { Clinic } from '../types';
import { queryKeys } from './queryKeys';

export const clinicQueryOptions = {
  current: () =>
    queryOptions<Clinic | null>({
      queryKey: queryKeys.clinic(),
      queryFn: () => clinicService.getCurrentClinic(),
      // Clinic data rarely changes, can have longer staleTime
      staleTime: 1000 * 60 * 10, // 10 minutes
    }),

  stats: (dateRange?: { start: string; end: string }) =>
    queryOptions({
      queryKey: queryKeys.clinicStats(dateRange),
      queryFn: () => clinicService.getStats(undefined, dateRange),
      // Stats should refresh more frequently
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),
};

export function useCurrentClinic() {
  return useQuery(clinicQueryOptions.current());
}

export function useClinicStats(dateRange?: { start: string; end: string }) {
  return useQuery(clinicQueryOptions.stats(dateRange));
}
