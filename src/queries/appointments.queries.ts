import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '../api/appointments.api';
import type { Appointment } from '../types';
import { queryKeys } from './queryKeys';

export function useAppointments(params?: {
  page?: number;
  pageSize?: number;
  date?: string;
  doctorId?: string;
}) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const date = params?.date;
  const doctorId = params?.doctorId;

  return useQuery({
    queryKey: [...queryKeys.appointments, page, pageSize, date, doctorId],
    queryFn: () =>
      appointmentService.getAllAppointments(page, pageSize, date, doctorId),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
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
