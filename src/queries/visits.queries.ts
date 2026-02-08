import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { visitService } from '../api/visits.api';
import type { Visit } from '../types';
import { queryKeys } from './queryKeys';

interface VisitListParams {
  page?: number;
  pageSize?: number;
  date?: string;
  visitStatus?: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  doctorId?: string;
}

interface CreateVisitData {
  patientId: string;
  visitReason?: string;
  status?: 'waiting' | 'in_progress' | 'completed';
  doctorId?: string;
}

export const visitQueryOptions = {
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.visit(id),
      queryFn: () => visitService.getById(id),
      enabled: Boolean(id),
    }),

  byPatient: (patientId: string, limit = 50) =>
    queryOptions({
      queryKey: queryKeys.visitsByPatient(patientId),
      queryFn: () => visitService.getByPatientId(patientId, limit),
      enabled: Boolean(patientId),
    }),

  waiting: () =>
    queryOptions({
      queryKey: queryKeys.visitsWaiting(),
      queryFn: () => visitService.getWaitingVisits(),
    }),

  list: (params?: VisitListParams) =>
    queryOptions({
      queryKey: queryKeys.visitsList(params),
      queryFn: () =>
        visitService.getAllVisits(
          params?.page ?? 1,
          params?.pageSize ?? 20,
          params?.date,
          params?.visitStatus,
          params?.doctorId,
        ),
    }),
};

export function useVisit(id: string) {
  return useQuery(visitQueryOptions.detail(id));
}

export function useVisitsByPatient(patientId: string, limit = 50) {
  return useQuery(visitQueryOptions.byPatient(patientId, limit));
}

export function useWaitingVisits() {
  return useQuery(visitQueryOptions.waiting());
}

export function useVisitsList(params?: VisitListParams) {
  return useQuery(visitQueryOptions.list(params));
}

export function fetchVisitsByPatient(
  queryClient: QueryClient,
  patientId: string,
  limit = 50,
) {
  return queryClient.fetchQuery(visitQueryOptions.byPatient(patientId, limit));
}

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['visits', 'create'],
    mutationFn: (data: CreateVisitData) => visitService.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits });
      if (created?.patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visitsByPatient(created.patientId),
        });
      }
    },
  });
}

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['visits', 'updateStatus'],
    mutationFn: (data: { id: string; status: Visit['status'] }) =>
      visitService.updateStatus(data.id, data.status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits });
      if (updated?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visit(updated.id),
        });
      }
      if (updated?.patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visitsByPatient(updated.patientId),
        });
      }
    },
  });
}

export function useUpdateVisitNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['visits', 'updateNotes'],
    mutationFn: (data: { id: string; notes: string }) =>
      visitService.updateNotes(data.id, data.notes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits });
      if (updated?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visit(updated.id),
        });
      }
      if (updated?.patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visitsByPatient(updated.patientId),
        });
      }
    },
  });
}

export function useUpdateVisitPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['visits', 'updatePrescription'],
    mutationFn: (data: { id: string; prescription: Visit['prescription'] }) =>
      visitService.updatePrescription(data.id, data.prescription),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits });
      if (updated?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visit(updated.id),
        });
      }
      if (updated?.patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visitsByPatient(updated.patientId),
        });
      }
    },
  });
}

export function useCompleteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['visits', 'complete'],
    mutationFn: (id: string) => visitService.complete(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits });
      if (updated?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visit(updated.id),
        });
      }
      if (updated?.patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visitsByPatient(updated.patientId),
        });
      }
    },
  });
}
