import { apiClient } from './client';
import { ApiError } from '@/lib/queryClient';
import { toApiDateFormat } from '@/utils/dateFormat';
import type { DoctorWorkingHour, DoctorOffDay } from '@/types/api';

export const doctorScheduleService = {
  // ─── Working Hours ───

  async getWorkingHours(doctorId?: string): Promise<DoctorWorkingHour[]> {
    const params: Record<string, string> = {};
    if (doctorId) params.doctor_id = doctorId;

    const response = await apiClient.get<any>(
      '/doctor-schedule/working-hours',
      params,
    );

    if (!response.success || !response.data) {
      return [];
    }

    const results = Array.isArray(response.data)
      ? response.data
      : response.data.results || [];
    return results as DoctorWorkingHour[];
  },

  async createWorkingHour(data: {
    doctor_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes?: number;
  }): Promise<DoctorWorkingHour> {
    const response = await apiClient.post<any>(
      '/doctor-schedule/working-hours',
      data,
    );

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error?.message || 'Failed to create working hour',
        response.error?.code || 'WORKING_HOUR_CREATE_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    return response.data as DoctorWorkingHour;
  },

  async updateWorkingHour(
    id: string,
    data: {
      start_time?: string;
      end_time?: string;
      slot_duration_minutes?: number;
      is_active?: boolean;
    },
  ): Promise<DoctorWorkingHour> {
    const response = await apiClient.put<any>(
      `/doctor-schedule/working-hours/${id}`,
      data,
    );

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error?.message || 'Failed to update working hour',
        response.error?.code || 'WORKING_HOUR_UPDATE_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    return response.data as DoctorWorkingHour;
  },

  async deleteWorkingHour(id: string): Promise<void> {
    const response = await apiClient.delete<any>(
      `/doctor-schedule/working-hours/${id}`,
    );

    if (!response.success) {
      throw new ApiError(
        response.error?.message || 'Failed to delete working hour',
        response.error?.code || 'WORKING_HOUR_DELETE_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }
  },

  // ─── Off Days ───

  async getOffDays(params?: {
    doctorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DoctorOffDay[]> {
    const queryParams: Record<string, string> = {};
    if (params?.doctorId) queryParams.doctor_id = params.doctorId;
    if (params?.startDate)
      queryParams.start_date = toApiDateFormat(params.startDate);
    if (params?.endDate)
      queryParams.end_date = toApiDateFormat(params.endDate);

    const response = await apiClient.get<any>(
      '/doctor-schedule/off-days',
      queryParams,
    );

    if (!response.success || !response.data) {
      return [];
    }

    const results = Array.isArray(response.data)
      ? response.data
      : response.data.results || [];
    return results as DoctorOffDay[];
  },

  async createOffDay(data: {
    doctor_id: string;
    date: string; // YYYY-MM-DD
    reason?: string;
  }): Promise<DoctorOffDay> {
    const response = await apiClient.post<any>('/doctor-schedule/off-days', {
      doctor_id: data.doctor_id,
      date: toApiDateFormat(data.date),
      reason: data.reason,
    });

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error?.message || 'Failed to create off day',
        response.error?.code || 'OFF_DAY_CREATE_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    return response.data as DoctorOffDay;
  },

  async deleteOffDay(id: string): Promise<void> {
    const response = await apiClient.delete<any>(
      `/doctor-schedule/off-days/${id}`,
    );

    if (!response.success) {
      throw new ApiError(
        response.error?.message || 'Failed to delete off day',
        response.error?.code || 'OFF_DAY_DELETE_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }
  },
};
