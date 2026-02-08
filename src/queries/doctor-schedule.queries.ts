import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { doctorScheduleService } from '../api/doctor-schedule.api';
import { queryKeys } from './queryKeys';

// ─── Query Options ───

export const doctorScheduleQueryOptions = {
  workingHours: (doctorId?: string) =>
    queryOptions({
      queryKey: queryKeys.workingHours(doctorId),
      queryFn: () => doctorScheduleService.getWorkingHours(doctorId),
      enabled: !!doctorId,
    }),

  offDays: (params?: {
    doctorId?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    queryOptions({
      queryKey: queryKeys.offDays(params),
      queryFn: () => doctorScheduleService.getOffDays(params),
      enabled: !!params?.doctorId,
    }),
};

// ─── Query Hooks ───

export function useWorkingHours(doctorId?: string) {
  return useQuery(doctorScheduleQueryOptions.workingHours(doctorId));
}

export function useOffDays(params?: {
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery(doctorScheduleQueryOptions.offDays(params));
}

// ─── Mutation Hooks ───

export function useCreateWorkingHour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['doctorSchedule', 'createWorkingHour'],
    mutationFn: doctorScheduleService.createWorkingHour,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorSchedule,
      });
    },
  });
}

export function useUpdateWorkingHour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['doctorSchedule', 'updateWorkingHour'],
    mutationFn: (data: {
      id: string;
      updates: {
        start_time?: string;
        end_time?: string;
        slot_duration_minutes?: number;
        is_active?: boolean;
      };
    }) => doctorScheduleService.updateWorkingHour(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorSchedule,
      });
    },
  });
}

export function useDeleteWorkingHour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['doctorSchedule', 'deleteWorkingHour'],
    mutationFn: doctorScheduleService.deleteWorkingHour,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorSchedule,
      });
    },
  });
}

export function useCreateOffDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['doctorSchedule', 'createOffDay'],
    mutationFn: doctorScheduleService.createOffDay,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorSchedule,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots });
    },
  });
}

export function useDeleteOffDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['doctorSchedule', 'deleteOffDay'],
    mutationFn: doctorScheduleService.deleteOffDay,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorSchedule,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.slots });
    },
  });
}
