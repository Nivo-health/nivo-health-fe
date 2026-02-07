// TanStack Query v5: Patient Queries
// Best practices: queryOptions factory, proper invalidation

import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { patientService, PatientSearchResult } from '../api/patients.api';
import type { Patient } from '../types';
import { queryKeys } from './queryKeys';

// ============================================
// Query Options (v5 pattern for reusability)
// ============================================

export const patientQueryOptions = {
  search: (query: string, limit = 20) =>
    queryOptions({
      queryKey: queryKeys.patientSearch(query),
      queryFn: () => patientService.search(query, limit),
      enabled: query.trim().length >= 2,
      staleTime: 1000 * 30, // 30 seconds for search results
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.patient(id),
      queryFn: () => patientService.getById(id),
      enabled: Boolean(id),
    }),

  list: () =>
    queryOptions<PatientSearchResult[]>({
      queryKey: queryKeys.patientsList(),
      queryFn: () => patientService.getAll(),
    }),

  recent: (limit = 10) =>
    queryOptions<PatientSearchResult[]>({
      queryKey: queryKeys.patientsRecent(limit),
      queryFn: () => patientService.getRecent(limit),
    }),
};

// ============================================
// Query Hooks
// ============================================

export function usePatientSearch(query: string, limit = 20) {
  return useQuery(patientQueryOptions.search(query, limit));
}

export function usePatient(id: string) {
  return useQuery(patientQueryOptions.detail(id));
}

export function useAllPatients() {
  return useQuery(patientQueryOptions.list());
}

export function useRecentPatients(limit = 10) {
  return useQuery(patientQueryOptions.recent(limit));
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['patients', 'create'],
    mutationFn: (data: Omit<Patient, 'id' | 'createdAt'>) =>
      patientService.create(data),
    onSuccess: (created) => {
      // v5: invalidateQueries uses object syntax
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      if (created?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.patient(created.id),
        });
      }
    },
  });
}
