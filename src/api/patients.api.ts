// Patient service - Uses API format as per API_SPECIFICATION.md
// Currently uses mock API client (localStorage), ready for backend integration

import { get, post } from './client';
import { ApiError } from '@/lib/query-client';
import type { Patient } from '../types';
import dayjs from 'dayjs';

export interface PatientSearchResult extends Patient {
  lastVisitDate?: string;
}

export const patientService = {
  /**
   * Search patients by name or mobile
   * GET /api/patients/search?query={query}
   */
  async search(query: string, limit: number = 20): Promise<Patient[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const response = await get<PatientSearchResult[]>('/patients/search', {
      query: query,
      limit,
    });

    if (!response.success || !response.data) {
      return [];
    }

    // Map API response to Patient format
    const apiPatients = Array.isArray(response.data) ? response.data : [];
    return apiPatients.map((apiPatient: any) => ({
      id: apiPatient.id,
      name: apiPatient.name || '',
      mobile: apiPatient.mobile_number || apiPatient.mobile || '',
      age: this.getAgeFromApiPatient(apiPatient),
      gender: this.mapGender(apiPatient.gender),
      createdAt:
        apiPatient.created_at || apiPatient.createdAt || dayjs().toISOString(),
    }));
  },

  /**
   * Get patient by ID
   * GET /api/patient/:patientId (singular)
   */
  async getById(id: string): Promise<Patient | null> {
    try {
      const response = await get<any>(`/patient/${id}`);

      if (!response.success || !response.data) {
        return null;
      }

      // Map API response to Patient format
      const apiPatient = response.data;
      const mappedPatient: Patient = {
        id: apiPatient.id,
        name: apiPatient.name || '',
        mobile: apiPatient.mobile_number || apiPatient.mobile || '',
        age: this.getAgeFromApiPatient(apiPatient),
        gender: this.mapGender(apiPatient.gender),
        createdAt:
          apiPatient.created_at ||
          apiPatient.createdAt ||
          dayjs().toISOString(),
      };

      return mappedPatient;
    } catch (error: any) {
      return null;
    }
  },

  /**
   * Create a new patient
   * POST /api/patient (singular, not plural)
   */
  async create(
    patientData: Omit<Patient, 'id' | 'createdAt'>,
  ): Promise<Patient> {
    // Map our Patient format to API request format
    // Backend will get clinic_id from cookie
    const apiRequestData = {
      name: patientData.name,
      mobile_number: patientData.mobile,
      gender: this.mapGenderToAPI(patientData.gender),
      email: (patientData as any).email || null,
      address: (patientData as any).address || null,
      date_of_birth: patientData.age
        ? this.calculateDateOfBirth(patientData.age)
        : null,
      blood_group:
        (patientData as any).bloodGroup ||
        (patientData as any).blood_group ||
        null,
    };

    const response = await post<any>('/patient', apiRequestData);

    if (!response.success || !response.data) {
      throw new ApiError(
        response.error?.message || 'Failed to create patient',
        response.error?.code || 'PATIENT_CREATE_ERROR',
        response.error?.statusCode,
        response.error?.details,
      );
    }

    // Map API response back to our Patient format
    const apiPatient = response.data;
    const mappedPatient: Patient = {
      id: apiPatient.id,
      name: apiPatient.name || '',
      mobile: apiPatient.mobile_number || apiPatient.mobile || '',
      age: this.getAgeFromApiPatient(apiPatient),
      gender: this.mapGender(apiPatient.gender),
      createdAt:
        apiPatient.created_at || apiPatient.createdAt || dayjs().toISOString(),
    };

    return mappedPatient;
  },

  /**
   * Get recent patients
   * GET /api/v1/patients/recent?limit={limit}
   */
  async getRecent(limit: number = 10): Promise<PatientSearchResult[]> {
    const response = await get<PatientSearchResult[]>('/patients/recent', {
      limit,
    });

    if (!response.success || !response.data) {
      return [];
    }

    return response.data;
  },

  /**
   * Get all patients for a clinic
   * GET /api/patients/all
   */
  async getAll(_clinicId?: string): Promise<PatientSearchResult[]> {
    try {
      // Use real API endpoint - backend will get clinic_id from cookie
      const response = await get<PatientSearchResult[]>(`/patients/all`);

      // Check if response has data (even if empty array) - prioritize API response
      // Only fallback if there's an explicit error or data is completely missing
      if (response.data !== undefined && response.data !== null) {
        let patientsArray: any[] = [];

        // If data is an array, use it directly
        if (Array.isArray(response.data)) {
          patientsArray = response.data;
        }
        // If data is an object, check for array fields
        else if (
          typeof response.data === 'object' &&
          !Array.isArray(response.data)
        ) {
          const possibleArrayFields = [
            'data',
            'patients',
            'items',
            'results',
            'content',
          ];
          for (const field of possibleArrayFields) {
            if (response.data[field] && Array.isArray(response.data[field])) {
              patientsArray = response.data[field];
              break;
            }
          }
        }

        if (patientsArray.length > 0) {
          // Map API fields to our Patient interface
          const mappedPatients = patientsArray.map((apiPatient: any) => ({
            id: apiPatient.id,
            name: apiPatient.name || '',
            mobile:
              apiPatient.mobile_number ||
              apiPatient.mobile ||
              apiPatient.phone ||
              '',
            age: this.getAgeFromApiPatient(apiPatient),
            gender: this.mapGender(apiPatient.gender),
            createdAt:
              apiPatient.created_at ||
              apiPatient.createdAt ||
              dayjs().toISOString(),
            // Keep original fields for reference
            ...(apiPatient.address && { address: apiPatient.address }),
            ...(apiPatient.email && { email: apiPatient.email }),
            ...(apiPatient.blood_group && {
              bloodGroup: apiPatient.blood_group,
            }),
          }));

          return mappedPatients;
        }

        // If no array found, return empty
        return [];
      }

      // Only fallback if API explicitly failed or data is missing
      // Fallback to mock/recent patients only if API explicitly failed
      const apiPatients = await this.getRecent(1000);
      if (apiPatients.length > 0) {
        return apiPatients;
      }

      // Final fallback: Direct localStorage access
      try {
        const STORAGE_KEY = 'clinic_patients';
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const patients = JSON.parse(stored);
          return patients.map((p: any) => ({
            ...p,
            lastVisitDate: undefined, // Will be calculated if needed
          }));
        }
      } catch (error) {
        // Error reading from localStorage
      }

      return [];
    } catch (error) {
      // Fallback to empty array
      return [];
    }
  },

  /**
   * Map API gender format to our format
   */
  mapGender(apiGender: string | undefined): 'M' | 'F' | undefined {
    if (!apiGender) return undefined;
    const upper = apiGender.toUpperCase();
    if (upper === 'MALE' || upper === 'M') return 'M';
    if (upper === 'FEMALE' || upper === 'F') return 'F';
    return undefined;
  },

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth: string): number | undefined {
    if (!dateOfBirth) return undefined;
    const birthDate = dayjs(dateOfBirth);
    if (!birthDate.isValid()) {
      return undefined;
    }
    const age = dayjs().diff(birthDate, 'year');
    return age >= 0 ? age : undefined;
  },

  /**
   * Get age from API patient data - only uses apiPatient.age if provided, does not calculate from date_of_birth
   */
  getAgeFromApiPatient(apiPatient: any): number | undefined {
    // Only use apiPatient.age if it's a valid number
    if (
      apiPatient.age !== undefined &&
      apiPatient.age !== null &&
      typeof apiPatient.age === 'number'
    ) {
      return apiPatient.age;
    }
    // Do not calculate from date_of_birth - return undefined if age not provided
    return undefined;
  },

  /**
   * Map our gender format to API format
   */
  mapGenderToAPI(gender: 'M' | 'F' | undefined): string {
    if (!gender) return 'MALE'; // Default
    return gender === 'M' ? 'MALE' : 'FEMALE';
  },

  /**
   * Calculate date of birth from age (approximate - uses current year)
   */
  calculateDateOfBirth(age: number): string | null {
    if (!age || age < 0) return null;
    return dayjs().subtract(age, 'year').startOf('year').format('YYYY-MM-DD');
  },
};
