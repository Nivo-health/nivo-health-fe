import { get, post, del } from './client';
import { ApiError } from '@/lib/query-client';
import { toApiDateFormat } from '@/utils/date-format';
import { appointmentService } from './appointments.api';
import type {
  AvailableSlotsResponse,
  Appointment,
  AppointmentSlot,
} from '@/types/api';

export const slotsService = {
  async getAvailableSlots(params: {
    doctor_id: string;
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
  }): Promise<AvailableSlotsResponse> {
    const response = await get<any>('/slots/available', {
      doctor_id: params.doctor_id,
      start_date: toApiDateFormat(params.start_date),
      end_date: toApiDateFormat(params.end_date),
    });

    if (!response.success || !response.data) {
      return {
        doctor_id: params.doctor_id,
        start_date: params.start_date,
        end_date: params.end_date,
        days: [],
      };
    }

    return response.data as AvailableSlotsResponse;
  },

  async bookSlot(data: {
    doctor_id: string;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM
    name: string;
    mobile_number: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    source?: string;
  }): Promise<Appointment> {
    const response = await post<any>('/slots/book', {
      doctor_id: data.doctor_id,
      date: toApiDateFormat(data.date),
      start_time: data.start_time,
      name: data.name,
      mobile_number: data.mobile_number,
      gender: data.gender,
      source: data.source || 'PHONE',
    });

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error?.message || 'Failed to book slot',
        response.error?.code || 'SLOT_BOOK_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    return appointmentService.mapApiAppointmentToAppointment(response.data);
  },

  async blockSlot(data: {
    doctor_id: string;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM
  }): Promise<AppointmentSlot> {
    const response = await post<any>('/slots/block', {
      doctor_id: data.doctor_id,
      date: toApiDateFormat(data.date),
      start_time: data.start_time,
    });

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error?.message || 'Failed to block slot',
        response.error?.code || 'SLOT_BLOCK_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    return response.data as AppointmentSlot;
  },

  async unblockSlot(slotId: string): Promise<void> {
    const response = await del<any>(`/slots/block/${slotId}`);

    if (!response.success) {
      throw new ApiError(
        response.error?.message || 'Failed to unblock slot',
        response.error?.code || 'SLOT_UNBLOCK_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }
  },
};
