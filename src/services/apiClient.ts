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
  private baseURL: string;

  constructor() {
    // Get base URL from environment variable or use default
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  }

  /**
   * Build full URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    return url.toString();
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
    // Check if this is a real API endpoint that should use HTTP
    if (
      endpoint.startsWith('/patients/clinic/') || 
      endpoint.startsWith('/clinics/') ||
      endpoint.startsWith('/patients/search') ||
      endpoint.startsWith('/patient/') || // /patient/:id (singular)
      (endpoint.startsWith('/patients/') && !endpoint.startsWith('/patients/clinic/') && !endpoint.startsWith('/patients/search')) || // fallback for /patients/:id
      endpoint.startsWith('/visits/patient/') || // /visits/patient/:patientId
      (endpoint.startsWith('/visits/') && endpoint.includes('/get-all/')) ||
      endpoint.match(/^\/visits\/[^/]+$/) || // /visits/:visitId
      endpoint.startsWith('/visits/prescription/') || // /visits/prescription/:prescriptionId
      (endpoint.startsWith('/visits/') && !endpoint.includes('/patient/'))
    ) {
      return this.realRequest<T>('GET', endpoint, undefined, params);
    }
    
    // For other endpoints, use mock for now
    return this.mockRequest<T>('GET', endpoint, undefined, params);
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Check if this is a real API endpoint that should use HTTP
    if (
      endpoint.startsWith('/patients/clinic/') || 
      endpoint.startsWith('/clinics/') ||
      endpoint === '/patient' || // POST /api/patient (singular for create)
      endpoint === '/patients' || // Keep for backward compatibility
      endpoint.startsWith('/patients/') ||
      endpoint === '/visits' ||
      endpoint.startsWith('/visits/')
    ) {
      return this.realRequest<T>('POST', endpoint, data);
    }
    
    // For other endpoints, use mock for now
    return this.mockRequest<T>('POST', endpoint, data);
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Check if this is a real API endpoint that should use HTTP
    if (
      endpoint.startsWith('/visits/') ||
      endpoint.startsWith('/patients/clinic/') || 
      endpoint.startsWith('/clinics/')
    ) {
      return this.realRequest<T>('PUT', endpoint, data);
    }
    
    // For other endpoints, use mock for now
    return this.mockRequest<T>('PUT', endpoint, data);
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Check if this is a real API endpoint that should use HTTP
    if (endpoint.startsWith('/patients/clinic/') || endpoint.startsWith('/clinics/')) {
      return this.realRequest<T>('PATCH', endpoint, data);
    }
    
    // For other endpoints, use mock for now
    return this.mockRequest<T>('PATCH', endpoint, data);
  }

  /**
   * Real HTTP request handler
   */
  private async realRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, string | number>
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildURL(endpoint, params);
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      console.log('🌐 Making API request to:', url);
      console.log('📋 Request options:', {
        method,
        headers: options.headers,
        body: options.body ? JSON.parse(options.body as string) : undefined,
      });
      const response = await fetch(url, options);
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      let result: any;
      
      // Clone response to read as text if needed for error handling
      const responseClone = response.clone();
      
      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (e) {
          // If JSON parsing fails, try to get text for error message
          const text = await responseClone.text();
          console.error('❌ Failed to parse JSON response:', {
            status: response.status,
            contentType,
            textPreview: text.substring(0, 200),
          });
          
          if (!response.ok) {
            return {
              success: false,
              error: {
                code: 'HTTP_ERROR',
                message: `Server returned ${response.status} ${response.statusText}. Response is not valid JSON.`,
                statusCode: response.status,
              },
            };
          }
          
          return {
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: 'Failed to parse server response as JSON',
              statusCode: response.status,
            },
          };
        }
      } else {
        // Not JSON content type - read as text
        const text = await response.text();
        console.error('❌ API returned non-JSON response:', {
          status: response.status,
          contentType,
          textPreview: text.substring(0, 500),
        });
        
        if (!response.ok) {
          return {
            success: false,
            error: {
              code: 'HTTP_ERROR',
              message: `Server returned ${response.status} ${response.statusText}. Expected JSON but got ${contentType || 'unknown'}. This usually means the endpoint doesn't exist.`,
              statusCode: response.status,
            },
          };
        }
        
        // Try to parse as JSON anyway (might be JSON without proper content-type)
        try {
          result = JSON.parse(text);
        } catch (e) {
          return {
            success: false,
            error: {
              code: 'INVALID_RESPONSE',
              message: `Server response is not valid JSON. Status: ${response.status}, Content-Type: ${contentType || 'unknown'}`,
              statusCode: response.status,
            },
          };
        }
      }
      
      console.log('📥 Raw API Response:', {
        status: response.status,
        ok: response.ok,
        result: result,
        resultType: typeof result,
        isArray: Array.isArray(result),
        resultKeys: result && typeof result === 'object' && !Array.isArray(result) ? Object.keys(result) : 'N/A',
      });

      if (!response.ok) {
        console.error('❌ API Error Response:', result);
        return {
          success: false,
          error: {
            code: result.error?.code || 'HTTP_ERROR',
            message: result.error?.message || result.message || `HTTP ${response.status}`,
            statusCode: response.status,
          },
        };
      }

      // Handle different response structures
      let apiResponse: ApiResponse<T>;
      
      // Case 1: API returns { success: true, data: [...] }
      if (result.success !== undefined && result.data !== undefined) {
        apiResponse = {
          success: result.success,
          data: result.data,
          message: result.message,
          error: result.error,
        };
      }
      // Case 2: API returns array directly [ {...}, {...} ]
      else if (Array.isArray(result)) {
        console.log('📋 API returned array directly, wrapping in response object');
        apiResponse = {
          success: true,
          data: result as T,
        };
      }
      // Case 3: API returns object with data field but no success
      else if (result.data !== undefined) {
        apiResponse = {
          success: true,
          data: result.data,
          message: result.message,
          error: result.error,
        };
      }
      // Case 4: API returns object directly - check for common array fields
      else {
        console.log('📦 API returned object directly, checking for array fields...');
        // Check if object has common array field names
        const possibleArrayFields = ['data', 'patients', 'items', 'results', 'content'];
        let foundArray: any = null;
        
        for (const field of possibleArrayFields) {
          if (result[field] && Array.isArray(result[field])) {
            foundArray = result[field];
            console.log(`✅ Found array in field '${field}' with ${foundArray.length} items`);
            break;
          }
        }
        
        if (foundArray) {
          apiResponse = {
            success: true,
            data: foundArray as T,
          };
        } else {
          // If no array found, use the object as-is (might be a single item or different structure)
          console.log('⚠️ No array field found in object, using object as data');
          apiResponse = {
            success: true,
            data: result as T,
          };
        }
      }

      console.log('✅ Normalized API Response:', apiResponse);
      return apiResponse;
    } catch (error: any) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed',
          statusCode: 0,
        },
      };
    }
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
    // Note: /patients/clinic/ and /clinics/ endpoints are handled by realRequest
    if (endpoint.startsWith('/patients/clinic/') || endpoint.startsWith('/clinics/')) {
      // This should not happen as it's handled in get/post/patch methods
      return {
        success: false,
        error: {
          code: 'INVALID_ROUTE',
          message: 'This endpoint should use real HTTP requests',
          statusCode: 500,
        },
      };
    } else if (endpoint.startsWith('/patients')) {
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
    _params?: Record<string, string | number>
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
    // NOTE: patient visit history is now fetched from real API: GET /api/visits/patient/:patientId

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
