// Clinic service - Fetches clinic data from API

import { apiClient } from './apiClient';
import type { Clinic } from '../types';

// clinic ID as per requirements
const CLINIC_ID = '1beae540-0651-4ebe-8d65-7434c596de9f';

export const clinicService = {
  /**
   * Get clinic ID (hardcoded for now)
   */
  getClinicId(): string {
    return CLINIC_ID;
  },

  /**
   * Get current clinic
   * GET /api/clinic (uses current_clinic_id from cookie)
   */
  async getCurrentClinic(): Promise<Clinic | null> {
    try {
      const response = await apiClient.get<Clinic>('/clinic');

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
   * Get clinic by ID (deprecated - use getCurrentClinic instead)
   * @deprecated Use getCurrentClinic() instead
   */
  async getById(_id?: string): Promise<Clinic | null> {
    // For backward compatibility, use getCurrentClinic
    return this.getCurrentClinic();
  },

  /**
   * Get clinic statistics
   * GET /api/clinic-stats?date_range=[DD-MM-YYYY,DD-MM-YYYY]
   */
  async getStats(
    _clinicId?: string,
    dateRange?: { start: string; end: string },
  ): Promise<{
    total_patients: number;
    total_visits: number;
    total_completed_visits: number;
    total_in_progress_visits: number;
    total_appointments: number;
    total_pending_visits: number;
    total_pending_appointments: number;
  } | null> {
    try {
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

      // Backend will get clinic_id from cookie
      const response = await apiClient.get<any>(`/clinic-stats`, params);

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
