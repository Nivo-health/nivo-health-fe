// Clinic service - Fetches clinic data from API

import { apiClient } from './apiClient';
import type { Clinic } from '../types';

// clinic ID as per requirements
const CLINIC_ID = '92c7233d-212c-4a5a-85f3-02994d99eee4';

export const clinicService = {
  /**
   * Get clinic ID (hardcoded for now)
   */
  getClinicId(): string {
    return CLINIC_ID;
  },

  /**
   * Get clinic by ID
   * GET /api/clinics/{id}
   */
  async getById(id?: string): Promise<Clinic | null> {
    try {
      const clinicId = id || CLINIC_ID;
      const response = await apiClient.get<Clinic>(`/clinics/${clinicId}`);

      if (!response.success || !response.data) {
        console.error('Failed to fetch clinic:', response.error?.message);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching clinic:', error);
      return null;
    }
  },

  /**
   * Get current clinic (uses hardcoded ID)
   */
  async getCurrentClinic(): Promise<Clinic | null> {
    return this.getById(CLINIC_ID);
  },

  /**
   * Get clinic statistics
   * GET /api/clinic-stats/{clinic_id}?date_range=[DD-MM-YYYY,DD-MM-YYYY]
   */
  async getStats(clinicId?: string, dateRange?: { start: string; end: string }): Promise<{
    total_patients: number;
    total_visits: number;
    total_completed_visits: number;
    total_in_progress_visits: number;
    total_appointments: number;
    total_pending_visits: number;
    total_pending_appointments: number;
  } | null> {
    try {
      const id = clinicId || CLINIC_ID;
      const params: Record<string, string> = {};
      
      // Format date range as [DD-MM-YYYY,DD-MM-YYYY]
      if (dateRange && dateRange.start && dateRange.end) {
        // Convert YYYY-MM-DD to DD-MM-YYYY
        const formatDateForAPI = (dateStr: string): string => {
          const [year, month, day] = dateStr.split('-');
          return `${day}-${month}-${year}`;
        };
        
        const startFormatted = formatDateForAPI(dateRange.start);
        const endFormatted = formatDateForAPI(dateRange.end);
        params.date_range = `[${startFormatted},${endFormatted}]`;
      }
      
      const response = await apiClient.get<any>(`/clinic-stats/${id}`, params);

      if (!response.success || !response.data) {
        console.error('Failed to fetch clinic stats:', response.error?.message);
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching clinic stats:', error);
      return null;
    }
  },
};
