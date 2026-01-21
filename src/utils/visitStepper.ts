import type { Visit } from '../types';

/**
 * Calculate the current step in the visit workflow
 * Steps: 0 = Add Notes, 1 = Generate Prescription, 2 = Print, 3 = Done
 */
export function getVisitStep(visit: Visit | null): number {
  if (!visit) return 0;
  
  if (visit.status === 'completed') {
    return 3; // Done
  }
  if (visit.prescription && visit.prescription.medicines.length > 0) {
    return 2; // Print
  }
  if (visit.notes && visit.notes.trim() !== '') {
    return 1; // Generate Prescription
  }
  return 0; // Add Notes
}

export const visitSteps = [
  { label: 'Add Notes', description: 'Consultation notes' },
  { label: 'Generate Prescription', description: 'Add medicines' },
  { label: 'Print', description: 'Preview & print' },
  { label: 'Done', description: 'Visit completed' },
];
