// TanStack Query v5: Query Keys Factory
// Best practice: Use array query keys with hierarchy

export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  authSession: () => [...queryKeys.auth, 'session'] as const,
  isAuthenticated: () => [...queryKeys.auth, 'isAuthenticated'] as const,

  // Patients
  patients: ['patients'] as const,
  patientsList: (params?: { page?: number; pageSize?: number }) =>
    [...queryKeys.patients, 'list', params] as const,
  patient: (id: string) => [...queryKeys.patients, 'detail', id] as const,
  patientSearch: (query: string, limit?: number) =>
    limit === undefined
      ? ([...queryKeys.patients, 'search', query] as const)
      : ([...queryKeys.patients, 'search', query, limit] as const),
  patientsRecent: (limit: number) =>
    [...queryKeys.patients, 'recent', limit] as const,

  // Visits
  visits: ['visits'] as const,
  visitsList: (params?: {
    page?: number;
    pageSize?: number;
    date?: string;
    visitStatus?: string;
    doctorId?: string;
  }) => [...queryKeys.visits, 'list', params] as const,
  visit: (id: string) => [...queryKeys.visits, 'detail', id] as const,
  visitsByPatient: (patientId: string, limit?: number) =>
    limit === undefined
      ? ([...queryKeys.visits, 'patient', patientId] as const)
      : ([...queryKeys.visits, 'patient', patientId, limit] as const),
  visitsWaiting: () => [...queryKeys.visits, 'waiting'] as const,

  // Clinics
  clinics: ['clinics'] as const,
  clinic: () => [...queryKeys.clinics, 'current'] as const,
  clinicStats: (dateRange?: { start: string; end: string }) =>
    [...queryKeys.clinics, 'stats', dateRange] as const,

  // Appointments
  appointments: ['appointments'] as const,
  appointmentsList: (params?: {
    page?: number;
    pageSize?: number;
    date?: string;
    doctorId?: string;
  }) => [...queryKeys.appointments, 'list', params] as const,
  appointment: (id: string) =>
    [...queryKeys.appointments, 'detail', id] as const,

  // Medications
  medications: (query: string) => ['medications', 'search', query] as const,

  // Prescriptions
  prescriptions: ['prescriptions'] as const,
  prescription: (id: string) =>
    [...queryKeys.prescriptions, 'detail', id] as const,

  // Doctor Schedule
  doctorSchedule: ['doctorSchedule'] as const,
  workingHours: (doctorId?: string) =>
    [...queryKeys.doctorSchedule, 'workingHours', doctorId] as const,
  offDays: (params?: {
    doctorId?: string;
    startDate?: string;
    endDate?: string;
  }) => [...queryKeys.doctorSchedule, 'offDays', params] as const,

  // Slots
  slots: ['slots'] as const,
  availableSlots: (params: {
    doctorId: string;
    startDate: string;
    endDate: string;
  }) => [...queryKeys.slots, 'available', params] as const,
} as const;
