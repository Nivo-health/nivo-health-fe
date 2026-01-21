// Visit service - Uses API format as per API_SPECIFICATION.md
// Currently uses mock API client (localStorage), ready for backend integration

import { apiClient } from './apiClient';
import type { Visit } from '../types';

export interface VisitHistoryItem {
  id: string;
  date: string;
  status: 'waiting' | 'in_progress' | 'completed';
  hasPrescription: boolean;
}

export const visitService = {
  /**
   * Create a new visit
   * POST /api/v1/visits
   */
  async create(visitData: { patientId: string; date?: string; status?: 'waiting' | 'in_progress' | 'completed' }): Promise<Visit> {
    const response = await apiClient.post<Visit>('/visits', {
      patientId: visitData.patientId,
      date: visitData.date || new Date().toISOString(),
      status: visitData.status || 'waiting',
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create visit');
    }

    return response.data;
  },

  /**
   * Get visit by ID
   * GET /api/v1/visits/:visitId
   */
  async getById(id: string): Promise<Visit | null> {
    const response = await apiClient.get<Visit>(`/visits/${id}`);

    if (!response.success || !response.data) {
      return null;
    }

    return response.data;
  },

  /**
   * Get patient visit history
   * GET /api/v1/visits/patient/:patientId?limit={limit}&status={status}
   */
  async getByPatientId(
    patientId: string,
    limit: number = 20,
    status?: 'waiting' | 'in_progress' | 'completed'
  ): Promise<Visit[]> {
    const params: Record<string, string | number> = { limit };
    if (status) {
      params.status = status;
    }

    const response = await apiClient.get<VisitHistoryItem[]>(
      `/visits/patient/${patientId}`,
      params
    );

    if (!response.success || !response.data) {
      return [];
    }

    // Convert history items to full visits by fetching each one
    const visits: Visit[] = [];
    for (const item of response.data) {
      const visit = await this.getById(item.id);
      if (visit) {
        visits.push(visit);
      }
    }

    return visits;
  },

  /**
   * Get active visit for a patient (helper method)
   * Note: This now checks for 'in_progress' status instead of 'active'
   */
  async getActiveByPatientId(patientId: string): Promise<Visit | null> {
    const visits = await this.getByPatientId(patientId, 1, 'in_progress');
    return visits.length > 0 ? visits[0] : null;
  },

  /**
   * Update visit notes
   * PATCH /api/v1/visits/:visitId/notes
   */
  async updateNotes(id: string, notes: string): Promise<Visit | null> {
    const response = await apiClient.patch<{ id: string; notes: string }>(
      `/visits/${id}/notes`,
      { notes }
    );

    if (!response.success) {
      return null;
    }

    // Return updated visit
    return this.getById(id);
  },

  /**
   * Update visit prescription
   * PATCH /api/v1/visits/:visitId/prescription
   */
  async updatePrescription(
    id: string,
    prescription: Visit['prescription']
  ): Promise<Visit | null> {
    const response = await apiClient.patch<{ id: string; prescription: Visit['prescription'] }>(
      `/visits/${id}/prescription`,
      {
        medicines: prescription?.medicines || [],
        followUp: prescription?.followUp || null,
      }
    );

    if (!response.success) {
      return null;
    }

    // Return updated visit
    return this.getById(id);
  },

  /**
   * Update visit status
   * PATCH /api/v1/visits/:visitId/status
   */
  async updateStatus(id: string, status: 'waiting' | 'in_progress' | 'completed'): Promise<Visit | null> {
    const response = await apiClient.patch<{ id: string; status: 'waiting' | 'in_progress' | 'completed' }>(
      `/visits/${id}/status`,
      { status }
    );

    if (!response.success) {
      return null;
    }

    // Return updated visit
    return this.getById(id);
  },

  /**
   * Get all waiting visits
   * GET /api/v1/visits/waiting
   */
  async getWaitingVisits(): Promise<Visit[]> {
    const response = await apiClient.get<Visit[]>('/visits/waiting');

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  },

  /**
   * Get next waiting visit (oldest waiting visit)
   */
  async getNextWaitingVisit(): Promise<Visit | null> {
    const waitingVisits = await this.getWaitingVisits();
    return waitingVisits.length > 0 ? waitingVisits[0] : null;
  },

  /**
   * Complete a visit
   * PATCH /api/v1/visits/:visitId/complete
   */
  async complete(id: string): Promise<Visit | null> {
    const response = await apiClient.patch<{ id: string; status: 'completed' }>(
      `/visits/${id}/complete`,
      { status: 'completed' }
    );

    if (!response.success) {
      return null;
    }

    // Return updated visit
    return this.getById(id);
  },
};
