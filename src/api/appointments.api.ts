// Appointment service - Handles appointment API calls

import { ApiError } from '@/lib/query-client';
import type { Appointment } from '@/types';
import { get, put } from './client';

export const appointmentService = {
  /**
   * Map API appointment to Appointment format
   */
  mapApiAppointmentToAppointment(apiAppointment: any): Appointment {
    return {
      id: apiAppointment.id,
      name: apiAppointment.name || '',
      mobile_number: apiAppointment.mobile_number || '',
      gender: apiAppointment.gender || 'MALE',
      doctor: apiAppointment.doctor
        ? {
            id: apiAppointment.doctor.id,
            name: apiAppointment.doctor.name || '',
            mobile_number: apiAppointment.doctor.mobile_number,
            email: apiAppointment.doctor.email,
            role: apiAppointment.doctor.role,
          }
        : undefined,
      clinic_id: apiAppointment.clinic_id || '',
      slot: apiAppointment.slot
        ? {
            id: apiAppointment.slot.id,
            date: apiAppointment.slot.date,
            start_time: apiAppointment.slot.start_time,
            end_time: apiAppointment.slot.end_time,
            slot_status: apiAppointment.slot.slot_status,
            created_at: apiAppointment.slot.created_at,
            updated_at: apiAppointment.slot.updated_at,
          }
        : null,
      appointment_date_time: apiAppointment.appointment_date_time || undefined,
      appointment_status: apiAppointment.appointment_status || 'WAITING',
      source: apiAppointment.source || 'PHONE',
      created_at: apiAppointment.created_at,
      updated_at: apiAppointment.updated_at,
    };
  },

  /**
   * Get all appointments for a clinic
   * GET /api/appointments/all/appointments?date=DD-MM-YYYY&doctor_id=uuid&page=1&page_size=20
   */
  async getAllAppointments(
    page: number = 1,
    pageSize: number = 20,
    date?: string,
    doctorId?: string,
  ): Promise<{
    appointments: Appointment[];
    count: number;
    next: string | null;
    previous: string | null;
  }> {
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };

      // Add date parameter if provided - convert from YYYY-MM-DD to DD-MM-YYYY
      if (date) {
        const [year, month, day] = date.split('-');
        params.date = `${day}-${month}-${year}`;
      }

      // Add doctor_id parameter if provided
      if (doctorId) {
        params.doctor_id = doctorId;
      }

      const response = await get<any>(`/appointments/all/appointments`, params);

      if (!response.success || !response.data) {
        return { appointments: [], count: 0, next: null, previous: null };
      }

      // Handle paginated response
      const apiData = response.data;
      const results =
        apiData.results || (Array.isArray(apiData) ? apiData : []);

      const appointments: Appointment[] = results.map((apiAppointment: any) =>
        this.mapApiAppointmentToAppointment(apiAppointment),
      );

      return {
        appointments,
        count: apiData.count || appointments.length,
        next: apiData.next || null,
        previous: apiData.previous || null,
      };
    } catch (error: any) {
      return { appointments: [], count: 0, next: null, previous: null };
    }
  },

  async updateStatus(
    appointmentId: string,
    status: 'WAITING' | 'CHECKED_IN' | 'NO_SHOW',
  ): Promise<Appointment | null> {
    const response = await put<any>(`/appointments/${appointmentId}`, {
      appointment_status: status,
    });

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error?.message || 'Failed to update appointment status',
        response.error?.code || 'APPOINTMENT_UPDATE_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    return this.mapApiAppointmentToAppointment(response.data);
  },
};
