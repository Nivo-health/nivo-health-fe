// Patient service - Uses API format as per API_SPECIFICATION.md
// Currently uses mock API client (localStorage), ready for backend integration

import { apiClient } from './apiClient';
import type { Patient } from '../types';

export interface PatientSearchResult extends Patient {
  lastVisitDate?: string;
}

export const patientService = {
  /**
   * Search patients by name or mobile
   * GET /api/v1/patients/search?q={query}&limit={limit}
   */
  async search(query: string, limit: number = 20): Promise<Patient[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const response = await apiClient.get<PatientSearchResult[]>('/patients/search', {
      q: query,
      limit,
    });

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  },

  /**
   * Get patient by ID
   * GET /api/v1/patients/:patientId
   */
  async getById(id: string): Promise<Patient | null> {
    const response = await apiClient.get<Patient>(`/patients/${id}`);

    if (!response.success || !response.data) {
      return null;
    }

    return response.data;
  },

  /**
   * Create a new patient
   * POST /api/v1/patients
   */
  async create(patientData: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    const response = await apiClient.post<Patient>('/patients', patientData);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create patient');
    }

    return response.data;
  },

  /**
   * Get recent patients
   * GET /api/v1/patients/recent?limit={limit}
   */
  async getRecent(limit: number = 10): Promise<PatientSearchResult[]> {
    const response = await apiClient.get<PatientSearchResult[]>('/patients/recent', { limit });

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  },

  /**
   * Get all patients
   * Direct access to all patients (for All Patients screen)
   */
  async getAll(): Promise<PatientSearchResult[]> {
    // Try API first
    const apiPatients = await this.getRecent(1000);
    if (apiPatients.length > 0) {
      return apiPatients;
    }
    
    // Fallback: Direct localStorage access if API returns empty
    try {
      const STORAGE_KEY = 'clinic_patients';
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const patients = JSON.parse(stored);
        console.log('Direct localStorage access - found patients:', patients.length);
        return patients.map((p: any) => ({
          ...p,
          lastVisitDate: undefined, // Will be calculated if needed
        }));
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    return [];
  },
};
