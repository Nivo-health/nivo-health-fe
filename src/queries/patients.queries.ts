import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { patientService, PatientSearchResult } from '../api/patients.api';
import type { Patient } from '@/types/api';
import { queryKeys } from './query-keys';

export const patientQueryOptions = {
  search: (query: string, limit = 20) =>
    queryOptions({
      queryKey: queryKeys.patientSearch(query, limit),
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

  list: (params?: { page?: number; pageSize?: number }) =>
    queryOptions({
      queryKey: queryKeys.patientsList(params),
      queryFn: () =>
        patientService.getAllPaginated(
          params?.page ?? 1,
          params?.pageSize ?? 20,
        ),
    }),

  recent: (limit = 10) =>
    queryOptions<PatientSearchResult[]>({
      queryKey: queryKeys.patientsRecent(limit),
      queryFn: () => patientService.getRecent(limit),
    }),
};

export function usePatientSearch(query: string, limit = 20) {
  return useQuery(patientQueryOptions.search(query, limit));
}

export function usePatient(id: string) {
  return useQuery(patientQueryOptions.detail(id));
}

export function useAllPatients(params?: { page?: number; pageSize?: number }) {
  return useQuery(patientQueryOptions.list(params));
}

export function useRecentPatients(limit = 10) {
  return useQuery(patientQueryOptions.recent(limit));
}

export function usePatientSearchLazy() {
  return useMutation({
    mutationKey: ['patients', 'search-lazy'],
    mutationFn: ({ query, limit = 20 }: { query: string; limit?: number }) =>
      patientService.search(query, limit),
  });
}

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
