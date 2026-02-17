// export const APPOINTMENT_STATUS = {
//   WAITING: 'WAITING',
//   CHECKED_IN: 'CHECKED_IN',
//   NO_SHOW: 'NO_SHOW',
// } as const;

import { APPOINTMENT_STATUS, GENDER, VISIT_STATUS } from '@/constants/api';

// export const GENDER = {
//   MALE: 'MALE',
//   FEMALE: 'FEMALE',
//   OTHER: 'OTHER',
// } as const;

// export const VISIT_STATUS = {
//   WAITING: 'WAITING',
//   IN_PROGRESS: 'IN_PROGRESS',
//   COMPLETED: 'COMPLETED',
//   CANCELLED: 'CANCELLED',
// } as const;

export interface Patient {
  id: string;
  name: string;
  mobile: string;
  age?: number;
  gender?: 'M' | 'F';
  createdAt: string;
}

export interface GetPDF {
  pdf_url: string;
}

export interface FollowUp {
  value: number;
  unit: 'days' | 'weeks' | 'months';
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  duration: string;
  notes?: string;
}

export interface Prescription {
  medicines: Medicine[];
  followUp?: FollowUp;
  notes?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  notes?: string;
  prescription?: Prescription;
  followUp?: FollowUp;
  status: 'waiting' | 'in_progress' | 'completed';
  patient?: Patient;
  clinic_id?: string;
  doctor_id?: string;
  visit_reason?: string;
  visit_status?: keyof typeof VISIT_STATUS;
  visit_date?: string;
  created_at?: string;
  updated_at?: string;
  prescription_id?: string | null;
  token_number?: number;
}

export interface ClinicDoctor {
  id: string;
  name: string;
  mobile_number?: string;
  email?: string;
  role?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website: string;
  createdAt?: string;
  updatedAt?: string;
  doctors?: ClinicDoctor[];
}

export interface AppointmentSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_status: 'BOOKED' | 'BLOCKED';
  created_at: string;
  updated_at: string;
}

export interface DoctorWorkingHour {
  id: string;
  doctor: ClinicDoctor;
  day_of_week: number;
  day_of_week_label: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorOffDay {
  id: string;
  doctor: ClinicDoctor;
  date: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  status: 'AVAILABLE';
}

export interface DaySlots {
  date: string;
  day_of_week: string;
  slots: AvailableSlot[];
}

export interface AvailableSlotsResponse {
  doctor_id: string;
  start_date: string;
  end_date: string;
  days: DaySlots[];
}

export interface Appointment {
  id: string;
  name: string;
  mobile_number: string;
  gender: keyof typeof GENDER;
  doctor?: ClinicDoctor;
  clinic_id: string;
  slot: AppointmentSlot | null;
  appointment_date_time?: string;
  appointment_status: keyof typeof APPOINTMENT_STATUS;
  source: string;
  created_at?: string;
  updated_at?: string;
}
