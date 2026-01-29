// Visit service - Uses API format as per API_SPECIFICATION.md
// Currently uses mock API client (localStorage), ready for backend integration

import { apiClient } from './apiClient';
import type { Visit, Patient } from '../types';

export const visitService = {
  mapApiVisitToVisit(apiVisit: any, fallbackPatientId?: string): Visit {
    return {
      id: apiVisit.id,
      patientId: apiVisit.patient?.id || apiVisit.patient_id || fallbackPatientId || '',
      date: apiVisit.visit_date || apiVisit.created_at || new Date().toISOString(),
      status: this.mapVisitStatus(apiVisit.visit_status),
      // Notes saved from ConsultationScreen (if backend returns them)
      notes: apiVisit.notes || undefined,
      prescription: undefined,
      followUp: undefined,
      // New API fields
      patient: apiVisit.patient ? this.mapApiPatientToPatient(apiVisit.patient) : undefined,
      clinic_id: apiVisit.clinic_id,
      doctor_id: apiVisit.doctor_id,
      visit_reason: apiVisit.visit_reason,
      visit_status: apiVisit.visit_status,
      visit_date: apiVisit.visit_date,
      created_at: apiVisit.created_at,
      updated_at: apiVisit.updated_at,
      prescription_id: apiVisit.prescription_id || null,
    };
  },

  /**
   * Create a new visit
   * POST /api/visits
   */
  async create(visitData: { 
    patientId: string; 
    visitReason?: string;
    status?: 'waiting' | 'in_progress' | 'completed';
    doctorId?: string;
  }): Promise<Visit> {
    try {
      // Get clinic ID
      const { clinicService } = await import('./clinicService');
      const clinicId = clinicService.getClinicId();

      // Map status to API format
      const visitStatusMap: Record<string, 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'> = {
        'waiting': 'WAITING',
        'in_progress': 'IN_PROGRESS',
        'completed': 'COMPLETED',
      };
      const visitStatus = visitStatusMap[visitData.status || 'waiting'] || 'WAITING';

      // Prefer doctorId passed from caller; fall back to legacy hardcoded ID for safety
      const doctorId = visitData.doctorId || '948cfcaf-5295-431c-b531-76ff875b2dae';

      const apiRequestData = {
        patient_id: visitData.patientId,
        clinic_id: clinicId,
        doctor_id: doctorId,
        visit_reason: visitData.visitReason || 'General consultation',
        visit_status: visitStatus,
      };

      console.log('📤 Creating visit with API data:', apiRequestData);

      const response = await apiClient.post<any>('/visits', apiRequestData);

      if (!response.success || !response.data) {
        console.error('❌ Failed to create visit:', response.error);
        throw new Error(response.error?.message || 'Failed to create visit');
      }

      const apiVisit = response.data;
      const mappedVisit: Visit = this.mapApiVisitToVisit(apiVisit, visitData.patientId);

      console.log('✅ Visit created successfully:', mappedVisit);
      return mappedVisit;
    } catch (error: any) {
      console.error('❌ Error creating visit:', error);
      throw error;
    }
  },

  /**
   * Get visit by ID
   * GET /api/v1/visits/:visitId
   */
  async getById(id: string): Promise<Visit | null> {
    const response = await apiClient.get<any>(`/visits/${id}`);

    if (!response.success || !response.data) return null;

    return this.mapApiVisitToVisit(response.data);
  },

  /**
   * Get patient visit history
   * GET /api/visits/patient/:patientId
   */
  async getByPatientId(
    patientId: string,
    limit: number = 50
  ): Promise<Visit[]> {
    const response = await apiClient.get<any[]>(`/visits/patient/${patientId}`);

    if (!response.success || !response.data) return [];

    const apiVisits = Array.isArray(response.data) ? response.data : [];
    const mapped = apiVisits.map((v) => this.mapApiVisitToVisit(v, patientId));

    // Client-side limit (backend may not support it here)
    return mapped
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  },

  /**
   * Get active visit for a patient (helper method)
   * Note: This now checks for 'in_progress' status instead of 'active'
   */
  async getActiveByPatientId(patientId: string): Promise<Visit | null> {
    const visits = await this.getByPatientId(patientId, 50);
    return visits.find((v) => v.status === 'in_progress') || null;
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
   * PUT /api/visits/:visitId
   */
  async updateStatus(id: string, status: 'waiting' | 'in_progress' | 'completed'): Promise<Visit | null> {
    try {
      // Map frontend status to API format
      const statusMap: Record<string, 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'> = {
        'waiting': 'WAITING',
        'in_progress': 'IN_PROGRESS',
        'completed': 'COMPLETED',
      };
      const apiStatus = statusMap[status] || 'WAITING';

      const response = await apiClient.put<any>(
        `/visits/${id}`,
        { visit_status: apiStatus }
      );

      if (!response.success || !response.data) {
        console.error('❌ Failed to update visit status:', response.error);
        return null;
      }

      // Map and return updated visit
      return this.mapApiVisitToVisit(response.data);
    } catch (error: any) {
      console.error('❌ Error updating visit status:', error);
      return null;
    }
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

  /**
   * Get all visits for a clinic
   * GET /api/visits/{clinic_id}/get-all/?page=1&page_size=20&date=DD-MM-YYYY&visit_status=WAITING&doctor_id=uuid
   */
  async getAllVisits(
    page: number = 1, 
    pageSize: number = 20, 
    date?: string,
    visitStatus?: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    doctorId?: string
  ): Promise<{ visits: Visit[]; count: number; next: string | null; previous: string | null }> {
    try {
      const { clinicService } = await import('./clinicService');
      const clinicId = clinicService.getClinicId();

      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };

      // Add date parameter if provided - convert from YYYY-MM-DD to DD-MM-YYYY
      if (date) {
        // date is in YYYY-MM-DD format from the date input
        // Convert to DD-MM-YYYY format for the API
        const [year, month, day] = date.split('-');
        params.date = `${day}-${month}-${year}`;
      }

      // Add visit_status parameter if provided
      if (visitStatus) {
        params.visit_status = visitStatus;
      }

      // Add doctor_id parameter if provided
      if (doctorId) {
        params.doctor_id = doctorId;
      }

      const response = await apiClient.get<any>(`/visits/${clinicId}/get-all/`, params);

      if (!response.success || !response.data) {
        console.error('❌ Failed to get all visits:', response.error);
        return { visits: [], count: 0, next: null, previous: null };
      }

      // Handle paginated response
      const apiData = response.data;
      const results = apiData.results || (Array.isArray(apiData) ? apiData : []);
      
      const visits: Visit[] = results.map((apiVisit: any) => ({
        id: apiVisit.id,
        patientId: apiVisit.patient?.id || '',
        date: apiVisit.visit_date || apiVisit.created_at || new Date().toISOString(),
        status: this.mapVisitStatus(apiVisit.visit_status),
        notes: undefined,
        prescription: undefined,
        followUp: undefined,
        // New API fields
        patient: apiVisit.patient ? this.mapApiPatientToPatient(apiVisit.patient) : undefined,
        clinic_id: apiVisit.clinic_id,
        doctor_id: apiVisit.doctor_id,
        visit_reason: apiVisit.visit_reason,
        visit_status: apiVisit.visit_status,
        visit_date: apiVisit.visit_date,
        created_at: apiVisit.created_at,
        updated_at: apiVisit.updated_at,
      }));

      return {
        visits,
        count: apiData.count || visits.length,
        next: apiData.next || null,
        previous: apiData.previous || null,
      };
    } catch (error: any) {
      console.error('❌ Error getting all visits:', error);
      return { visits: [], count: 0, next: null, previous: null };
    }
  },

  /**
   * Map API visit status to our format
   */
  mapVisitStatus(apiStatus: string | undefined): 'waiting' | 'in_progress' | 'completed' {
    if (!apiStatus) return 'waiting';
    const upper = apiStatus.toUpperCase();
    if (upper === 'WAITING') return 'waiting';
    if (upper === 'IN_PROGRESS' || upper === 'INPROGRESS') return 'in_progress';
    if (upper === 'COMPLETED') return 'completed';
    return 'waiting';
  },

  /**
   * Map API patient to Patient format
   */
  mapApiPatientToPatient(apiPatient: any): Patient {
    const mapGender = (apiGender: string | undefined): 'M' | 'F' | undefined => {
      if (!apiGender) return undefined;
      const upper = apiGender.toUpperCase();
      if (upper === 'MALE' || upper === 'M') return 'M';
      if (upper === 'FEMALE' || upper === 'F') return 'F';
      return undefined;
    };

    // Only use apiPatient.age if provided - do not calculate from date_of_birth
    let age: number | undefined = undefined;
    if (apiPatient.age !== undefined && apiPatient.age !== null && typeof apiPatient.age === 'number') {
      age = apiPatient.age;
    }

    return {
      id: apiPatient.id,
      name: apiPatient.name || '',
      mobile: apiPatient.mobile_number || apiPatient.mobile || '',
      age: age,
      gender: mapGender(apiPatient.gender),
      createdAt: apiPatient.created_at || apiPatient.createdAt || new Date().toISOString(),
    };
  },
};
