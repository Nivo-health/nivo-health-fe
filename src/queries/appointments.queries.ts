import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { appointmentService } from '../api/appointments.api';
import { queryKeys } from './query-keys';

interface AppointmentListParams {
  page?: number;
  pageSize?: number;
  date?: string;
  doctorId?: string;
}

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

export function useAppointments(params?: AppointmentListParams) {
  return useQuery(appointmentQueryOptions.list(params));
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
