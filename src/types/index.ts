export interface Patient {
  id: string;
  name: string;
  mobile: string;
  age?: number;
  gender?: 'M' | 'F';
  createdAt: string;
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
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  notes?: string;
  prescription?: Prescription;
  followUp?: FollowUp;
  status: 'waiting' | 'in_progress' | 'completed';
}
