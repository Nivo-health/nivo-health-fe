// Appointment service - Handles appointment API calls

import { apiClient } from './client';
import type { Appointment } from '@/types';

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
      appointment_date_time: apiAppointment.appointment_date_time || '',
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

      const response = await apiClient.get<any>(
        `/appointments/all/appointments`,
        params,
      );

      if (!response.success || !response.data) {
        console.error('❌ Failed to get all appointments:', response.error);
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
      console.error('❌ Error getting all appointments:', error);
      return { appointments: [], count: 0, next: null, previous: null };
    }
  },

  /**
   * Create a new appointment
   * POST /api/appointments
   */
  async create(appointmentData: {
    name: string;
    mobile_number: string;
    gender: 'MALE' | 'FEMALE';
    doctor_id: string;
    appointment_date_time: string;
    appointment_status?: 'WAITING' | 'CHECKED_IN' | 'NO_SHOW';
    source?: string;
  }): Promise<Appointment> {
    try {
      // Backend will get clinic_id from cookie
      const apiRequestData = {
        name: appointmentData.name,
        mobile_number: appointmentData.mobile_number,
        gender: appointmentData.gender,
        doctor_id: appointmentData.doctor_id,
        appointment_date_time: appointmentData.appointment_date_time,
        appointment_status: appointmentData.appointment_status || 'WAITING',
        source: appointmentData.source || 'PHONE',
      };

      console.log('📤 Creating appointment with API data:', apiRequestData);

      const response = await apiClient.post<any>(
        '/appointments',
        apiRequestData,
      );

      if (!response.success || !response.data) {
        console.error('❌ Failed to create appointment:', response.error);
        // Create error object with details for validation errors
        const error: any = new Error(
          response.error?.message || 'Failed to create appointment',
        );
        error.code = response.error?.code;
        error.details = response.error?.details;
        throw error;
      }

      const mappedAppointment = this.mapApiAppointmentToAppointment(
        response.data,
      );
      console.log('✅ Appointment created successfully:', mappedAppointment);
      return mappedAppointment;
    } catch (error: any) {
      console.error('❌ Error creating appointment:', error);
      throw error;
    }
  },

  /**
   * Update appointment status
   * PUT /api/appointments/:appointmentId
   */
  async updateStatus(
    appointmentId: string,
    status: 'WAITING' | 'CHECKED_IN' | 'NO_SHOW',
  ): Promise<Appointment | null> {
    const response = await apiClient.put<any>(
      `/appointments/${appointmentId}`,
      { appointment_status: status },
    );

    if (!response.success || !response.data) {
      const error: any = new Error(
        response.error?.message || 'Failed to update appointment status',
      );
      error.code = response.error?.code;
      error.details = response.error?.details;
      throw error; // ✅ THROW
    }

    return this.mapApiAppointmentToAppointment(response.data);
  },
};
