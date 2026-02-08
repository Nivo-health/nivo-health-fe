import type { Visit } from '../types';

/**
 * Calculate the current step in the visit workflow
 * Steps: 0 = Add Notes, 1 = Generate Prescription, 2 = Print
 */
export function getVisitStep(
  visit: Visit | null | undefined,
  currentScreen?: 'consultation' | 'prescription' | 'print',
): number {
  if (!visit) return 0;

  // If prescription exists, notes step is complete (user has moved past it)
  if (visit.prescription && visit.prescription.medicines.length > 0) {
    return 2; // Print
  }

  // If we're on prescription screen, notes step is complete (user has moved past it)
  if (currentScreen === 'prescription' || currentScreen === 'print') {
    return 1; // Generate Prescription (notes step is complete)
  }

  // If notes exist, notes step is complete
  if (visit.notes && visit.notes.trim() !== '') {
    return 1; // Generate Prescription
  }

  return 0; // Add Notes
}

export const visitSteps = [
  { label: 'Add Notes' },
  { label: 'Generate Prescription' },
  { label: 'Preview & Print' },
];
