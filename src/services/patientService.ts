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
   * GET /api/patients/search?query={query}
   */
  async search(query: string, limit: number = 20): Promise<Patient[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const response = await apiClient.get<PatientSearchResult[]>(
      '/patients/search',
      {
        query: query,
        limit,
      },
    );

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
        apiPatient.created_at ||
        apiPatient.createdAt ||
        new Date().toISOString(),
    }));
  },

  /**
   * Get patient by ID
   * GET /api/patient/:patientId (singular)
   */
  async getById(id: string): Promise<Patient | null> {
    try {
      const response = await apiClient.get<any>(`/patient/${id}`);

      if (!response.success || !response.data) {
        console.error('❌ Failed to get patient by ID:', response.error);
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
          new Date().toISOString(),
      };

      return mappedPatient;
    } catch (error: any) {
      console.error('❌ Error getting patient by ID:', error);
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
    try {
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

      console.log('📤 Creating patient with API data:', apiRequestData);

      const response = await apiClient.post<any>('/patient', apiRequestData);

      if (!response.success || !response.data) {
        console.error('❌ Failed to create patient:', response.error);
        // Create error object with details for validation errors
        const error: any = new Error(
          response.error?.message || 'Failed to create patient',
        );
        error.code = response.error?.code;
        error.details = response.error?.details;
        throw error;
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
          apiPatient.created_at ||
          apiPatient.createdAt ||
          new Date().toISOString(),
      };

      console.log('✅ Patient created successfully:', mappedPatient);
      return mappedPatient;
    } catch (error: any) {
      console.error('❌ Error creating patient:', error);
      throw error;
    }
  },

  /**
   * Get recent patients
   * GET /api/v1/patients/recent?limit={limit}
   */
  async getRecent(limit: number = 10): Promise<PatientSearchResult[]> {
    const response = await apiClient.get<PatientSearchResult[]>(
      '/patients/recent',
      { limit },
    );

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
      console.log('Fetching all patients...');

      // Use real API endpoint - backend will get clinic_id from cookie
      const response =
        await apiClient.get<PatientSearchResult[]>(`/patients/all`);

      console.log('API Response:', {
        success: response.success,
        hasData: response.data !== undefined,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        dataKeys:
          response.data &&
          typeof response.data === 'object' &&
          !Array.isArray(response.data)
            ? Object.keys(response.data)
            : 'N/A',
        error: response.error,
        fullData: response.data, // Log full data to see structure
      });

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
              new Date().toISOString(),
            // Keep original fields for reference
            ...(apiPatient.address && { address: apiPatient.address }),
            ...(apiPatient.email && { email: apiPatient.email }),
            ...(apiPatient.blood_group && {
              bloodGroup: apiPatient.blood_group,
            }),
          }));

          console.log(
            '✅ Using API data (array) - patients count:',
            mappedPatients.length,
          );
          return mappedPatients;
        }

        // If no array found, log warning and return empty
        console.warn(
          '⚠️ API returned data but no array found. Data type:',
          typeof response.data,
        );
        return [];
      }

      // Only fallback if API explicitly failed or data is missing
      if (response.error) {
        console.warn(
          '❌ API request failed, falling back to mock data:',
          response.error?.message,
        );
      } else if (response.data === undefined || response.data === null) {
        console.warn(
          '⚠️ API response missing data field, falling back to mock data',
        );
      }

      // Fallback to mock/recent patients only if API explicitly failed
      console.log('🔄 Falling back to mock data...');
      const apiPatients = await this.getRecent(1000);
      if (apiPatients.length > 0) {
        console.log('📦 Using mock data - patients count:', apiPatients.length);
        return apiPatients;
      }

      // Final fallback: Direct localStorage access
      try {
        const STORAGE_KEY = 'clinic_patients';
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const patients = JSON.parse(stored);
          console.log(
            '💾 Using localStorage data - patients count:',
            patients.length,
          );
          return patients.map((p: any) => ({
            ...p,
            lastVisitDate: undefined, // Will be calculated if needed
          }));
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
      }

      console.log('📭 No data found, returning empty array');
      return [];
    } catch (error) {
      console.error('❌ Failed to get all patients:', error);
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
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age >= 0 ? age : undefined;
    } catch (error) {
      return undefined;
    }
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
    try {
      const today = new Date();
      const birthYear = today.getFullYear() - age;
      // Use January 1st as approximate date
      const dateOfBirth = new Date(birthYear, 0, 1);
      return dateOfBirth.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch (error) {
      return null;
    }
  },
};
