// TanStack Query v5: Appointment Queries
// Best practices: queryOptions factory, proper invalidation

import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { appointmentService } from '../api/appointments.api';
import type { Appointment } from '../types';
import { queryKeys } from './queryKeys';

// ============================================
// Types
// ============================================

interface AppointmentListParams {
  page?: number;
  pageSize?: number;
  date?: string;
  doctorId?: string;
}

interface CreateAppointmentData {
  name: string;
  mobile_number: string;
  gender: 'MALE' | 'FEMALE';
  doctor_id: string;
  appointment_date_time: string;
  appointment_status?: 'WAITING' | 'CHECKED_IN' | 'NO_SHOW';
  source?: string;
}

// ============================================
// Query Options (v5 pattern for reusability)
// ============================================

export const appointmentQueryOptions = {
  list: (params?: AppointmentListParams) =>
    queryOptions({
      queryKey: queryKeys.appointmentsList(params),
      queryFn: () =>
        appointmentService.getAllAppointments(
          params?.page ?? 1,
          params?.pageSize ?? 20,
          params?.date,
          params?.doctorId,
        ),
    }),
};

// ============================================
// Query Hooks
// ============================================

export function useAppointments(params?: AppointmentListParams) {
  return useQuery(appointmentQueryOptions.list(params));
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, Error, CreateAppointmentData>({
    mutationKey: ['appointments', 'create'],
    mutationFn: appointmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['appointments', 'updateStatus'],
    mutationFn: async (data: {
      appointmentId: string;
      status: 'WAITING' | 'CHECKED_IN' | 'NO_SHOW';
    }) => {
      return appointmentService.updateStatus(data.appointmentId, data.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
    },
  });
}
