// TanStack Query v5: Centralized exports
// All query hooks and options

// Query Keys
export { queryKeys } from './queryKeys';

// Auth
export {
  useLogin,
  useLogout,
  useIsAuthenticated,
  authQueryOptions,
} from './auth.queries';

// Patients
export {
  usePatient,
  usePatientSearch,
  useAllPatients,
  useRecentPatients,
  useCreatePatient,
  patientQueryOptions,
} from './patients.queries';

// Visits
export {
  useVisit,
  useVisitsByPatient,
  useWaitingVisits,
  useVisitsList,
  useCreateVisit,
  useUpdateVisitStatus,
  useUpdateVisitNotes,
  useUpdateVisitPrescription,
  useCompleteVisit,
  fetchVisitsByPatient,
  visitQueryOptions,
} from './visits.queries';

// Appointments
export {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointmentStatus,
  appointmentQueryOptions,
} from './appointments.queries';

// Clinic
export {
  useCurrentClinic,
  useClinicStats,
  clinicQueryOptions,
} from './clinic.queries';

// Medications
export {
  useMedicationSearch,
  medicationQueryOptions,
} from './medications.queries';

// Prescriptions
export {
  usePrescription,
  usePrescriptionsByIds,
  useCreatePrescription,
  useUpdatePrescription,
  useSavePrescription,
  prescriptionQueryOptions,
} from './prescriptions.queries';

// WhatsApp
export {
  useSendVisitConfirmation,
  useSendPrescription,
} from './whatsapp.queries';
