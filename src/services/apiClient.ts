// API Client - Handles API requests with standardized format
// Currently uses localStorage as mock, but structured to match API specification

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

class ApiClient {
  // Base URL kept for future real API calls
  constructor() {}

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
    // For now, use localStorage mock
    // When backend is ready, replace with: 
    // const url = this.buildURL(endpoint, params);
    // return fetch(url).then(res => res.json())
    return this.mockRequest<T>('GET', endpoint, undefined, params);
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // For now, use localStorage mock
    // When backend is ready, replace with:
    // const url = `${this.baseURL}${endpoint}`;
    // return fetch(url, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // }).then(res => res.json())
    return this.mockRequest<T>('POST', endpoint, data);
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // For now, use localStorage mock
    // When backend is ready, replace with:
    // const url = `${this.baseURL}${endpoint}`;
    // return fetch(url, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // }).then(res => res.json())
    return this.mockRequest<T>('PATCH', endpoint, data);
  }

  /**
   * Mock request handler (uses localStorage)
   * This will be replaced with actual fetch calls when backend is ready
   */
  private async mockRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, string | number>
  ): Promise<ApiResponse<T>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Route to appropriate mock handler
    if (endpoint.startsWith('/patients')) {
      return this.handlePatientRequest<T>(method, endpoint, data, params);
    } else if (endpoint.startsWith('/visits')) {
      return this.handleVisitRequest<T>(method, endpoint, data, params);
    } else if (endpoint.startsWith('/whatsapp')) {
      return this.handleWhatsAppRequest<T>(method, endpoint, data);
    } else if (endpoint.startsWith('/clinic')) {
      return this.handleClinicRequest<T>(method, endpoint);
    }

    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${endpoint} not found`,
        statusCode: 404,
      },
    };
  }

  /**
   * Handle patient-related requests
   */
  private handlePatientRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, string | number>
  ): ApiResponse<T> {
    const STORAGE_KEY = 'clinic_patients';
    const stored = localStorage.getItem(STORAGE_KEY);
    const patients: any[] = stored ? JSON.parse(stored) : [];
    
    // Debug log
    if (endpoint === '/patients/recent') {
      console.log('API Client - Patients in storage:', patients.length);
    }

    if (endpoint === '/patients/search' && method === 'GET') {
      const query = params?.q as string;
      if (!query || query.length < 2) {
        return { success: true, data: [] as T };
      }

      const lowerQuery = query.toLowerCase();
      const results = patients
        .filter((p: any) => {
          const nameMatch = p.name?.toLowerCase().includes(lowerQuery);
          const mobileMatch = p.mobile?.includes(query);
          return nameMatch || mobileMatch;
        })
        .map((p: any) => ({
          ...p,
          lastVisitDate: this.getLastVisitDate(p.id),
        }))
        .slice(0, params?.limit ? Number(params.limit) : 20);

      return { success: true, data: results as T };
    }

    if (endpoint.startsWith('/patients/') && method === 'GET') {
      const patientId = endpoint.split('/')[2];
      const patient = patients.find((p: any) => p.id === patientId);
      if (!patient) {
        return {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: `Patient with ID ${patientId} not found`,
            statusCode: 404,
          },
        };
      }
      return { success: true, data: patient as T };
    }

    if (endpoint === '/patients' && method === 'POST') {
      const newPatient = {
        ...data,
        id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      patients.push(newPatient);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
      return { success: true, data: newPatient as T };
    }

    if (endpoint === '/patients/recent' && method === 'GET') {
      const limit = params?.limit ? Number(params.limit) : 10;
      const allPatients = patients
        .map((p: any) => ({
          ...p,
          lastVisitDate: this.getLastVisitDate(p.id),
        }))
        .sort((a: any, b: any) => {
          // Sort by lastVisitDate if available, otherwise by createdAt
          const aDate = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : new Date(a.createdAt).getTime();
          const bDate = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : new Date(b.createdAt).getTime();
          return bDate - aDate;
        })
        .slice(0, limit);
      return { success: true, data: allPatients as T };
    }

    return {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${method} not allowed for ${endpoint}`,
        statusCode: 405,
      },
    };
  }

  /**
   * Handle visit-related requests
   */
  private handleVisitRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, string | number>
  ): ApiResponse<T> {
    const STORAGE_KEY = 'clinic_visits';
    const visits: any[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (endpoint === '/visits' && method === 'POST') {
      const newVisit = {
        patientId: data.patientId,
        date: data.date || new Date().toISOString(),
        id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: data.status || 'waiting',
        notes: null,
        prescription: null,
        followUp: null,
      };
      visits.push(newVisit);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
      return { success: true, data: newVisit as T };
    }

    // Check /visits/patient/ BEFORE /visits/:visitId to avoid route conflicts
    if (endpoint.startsWith('/visits/patient/') && method === 'GET') {
      const patientId = endpoint.split('/')[3];
      const patientVisits = visits
        .filter((v: any) => v.patientId === patientId)
        .map((v: any) => ({
          id: v.id,
          date: v.date,
          status: v.status,
          hasPrescription: !!v.prescription,
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, params?.limit ? Number(params.limit) : 20);
      return { success: true, data: patientVisits as T };
    }

    if (endpoint.startsWith('/visits/') && method === 'GET') {
      const visitId = endpoint.split('/')[2];
      const visit = visits.find((v: any) => v.id === visitId);
      if (!visit) {
        return {
          success: false,
          error: {
            code: 'VISIT_NOT_FOUND',
            message: `Visit with ID ${visitId} not found`,
            statusCode: 404,
          },
        };
      }
      return { success: true, data: visit as T };
    }

    if (endpoint.startsWith('/visits/') && endpoint.endsWith('/notes') && method === 'PATCH') {
      const visitId = endpoint.split('/')[2];
      const index = visits.findIndex((v: any) => v.id === visitId);
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'VISIT_NOT_FOUND',
            message: `Visit with ID ${visitId} not found`,
            statusCode: 404,
          },
        };
      }
      visits[index].notes = data.notes;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
      return { success: true, data: { id: visitId, notes: data.notes } as T };
    }

    if (endpoint.startsWith('/visits/') && endpoint.endsWith('/prescription') && method === 'PATCH') {
      const visitId = endpoint.split('/')[2];
      const index = visits.findIndex((v: any) => v.id === visitId);
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'VISIT_NOT_FOUND',
            message: `Visit with ID ${visitId} not found`,
            statusCode: 404,
          },
        };
      }
      const prescription = {
        medicines: data.medicines.map((m: any, idx: number) => ({
          ...m,
          id: m.id || `med_${Date.now()}_${idx}`,
        })),
        followUp: data.followUp || null,
      };
      visits[index].prescription = prescription;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
      return { success: true, data: { id: visitId, prescription } as T };
    }

    if (endpoint.startsWith('/visits/') && endpoint.endsWith('/status') && method === 'PATCH') {
      const visitId = endpoint.split('/')[2];
      const index = visits.findIndex((v: any) => v.id === visitId);
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'VISIT_NOT_FOUND',
            message: `Visit with ID ${visitId} not found`,
            statusCode: 404,
          },
        };
      }
      visits[index].status = data.status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
      return { success: true, data: { id: visitId, status: data.status } as T };
    }

    if (endpoint === '/visits/waiting' && method === 'GET') {
      const waitingVisits = visits
        .filter((v: any) => v.status === 'waiting')
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { success: true, data: waitingVisits as T };
    }

    if (endpoint.startsWith('/visits/') && endpoint.endsWith('/complete') && method === 'PATCH') {
      const visitId = endpoint.split('/')[2];
      const index = visits.findIndex((v: any) => v.id === visitId);
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'VISIT_NOT_FOUND',
            message: `Visit with ID ${visitId} not found`,
            statusCode: 404,
          },
        };
      }
      visits[index].status = 'completed';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
      return { success: true, data: { id: visitId, status: 'completed' } as T };
    }

    return {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${method} not allowed for ${endpoint}`,
        statusCode: 405,
      },
    };
  }

  /**
   * Handle WhatsApp-related requests
   */
  private handleWhatsAppRequest<T>(
    method: string,
    endpoint: string,
    data?: any
  ): ApiResponse<T> {
    if (endpoint === '/whatsapp/visit-confirmation' && method === 'POST') {
      return {
        success: true,
        message: `WhatsApp message sent to +91${data.mobile}`,
        data: {
          sent: true,
          timestamp: new Date().toISOString(),
        } as T,
      };
    }

    if (endpoint === '/whatsapp/prescription' && method === 'POST') {
      return {
        success: true,
        message: 'Prescription sent on WhatsApp',
        data: {
          sent: true,
          timestamp: new Date().toISOString(),
        } as T,
      };
    }

    return {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${method} not allowed for ${endpoint}`,
        statusCode: 405,
      },
    };
  }

  /**
   * Handle clinic-related requests
   */
  private handleClinicRequest<T>(method: string, endpoint: string): ApiResponse<T> {
    if (endpoint === '/clinic/info' && method === 'GET') {
      const clinicName = (import.meta as any).env?.VITE_CLINIC_NAME || 'Clinic OPD Management';
      return {
        success: true,
        data: {
          name: clinicName,
          address: '',
          phone: '',
          email: '',
        } as T,
      };
    }

    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${endpoint} not found`,
        statusCode: 404,
      },
    };
  }

  /**
   * Helper to get last visit date for a patient
   */
  private getLastVisitDate(patientId: string): string | null {
    const STORAGE_KEY = 'clinic_visits';
    const visits: any[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const patientVisits = visits
      .filter((v: any) => v.patientId === patientId)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return patientVisits.length > 0 ? patientVisits[0].date : null;
  }
}

export const apiClient = new ApiClient();
