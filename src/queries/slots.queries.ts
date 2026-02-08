import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { slotsService } from '../api/slots.api';
import { queryKeys } from './query-keys';
import type { Appointment, AppointmentSlot } from '@/types/api';

// ─── Query Options ───

export const slotsQueryOptions = {
  available: (params: {
    doctorId: string;
    startDate: string;
    endDate: string;
  }) =>
    queryOptions({
      queryKey: queryKeys.availableSlots(params),
      queryFn: () =>
        slotsService.getAvailableSlots({
          doctor_id: params.doctorId,
          start_date: params.startDate,
          end_date: params.endDate,
        }),
      enabled: !!params.doctorId && !!params.startDate && !!params.endDate,
    }),
};

// ─── Query Hooks ───

export function useAvailableSlots(params: {
  doctorId: string;
  startDate: string;
  endDate: string;
}) {
  return useQuery(slotsQueryOptions.available(params));
}

// ─── Mutation Hooks ───

export function useBookSlot() {
  const queryClient = useQueryClient();

  return useMutation<
    Appointment,
    Error,
    {
      doctor_id: string;
      date: string;
      start_time: string;
      name: string;
      mobile_number: string;
      gender: 'MALE' | 'FEMALE' | 'OTHER';
      source?: string;
    }
  >({
    mutationKey: ['slots', 'book'],
    mutationFn: slotsService.bookSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots });
    },
  });
}

export function useBlockSlot() {
  const queryClient = useQueryClient();

  return useMutation<
    AppointmentSlot,
    Error,
    { doctor_id: string; date: string; start_time: string }
  >({
    mutationKey: ['slots', 'block'],
    mutationFn: slotsService.blockSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.slots });
    },
  });
}

export function useUnblockSlot() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationKey: ['slots', 'unblock'],
    mutationFn: slotsService.unblockSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.slots });
    },
  });
}
