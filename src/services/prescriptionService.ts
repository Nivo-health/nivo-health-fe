// Prescription service - Uses API format as per API_SPECIFICATION.md
// Currently uses mock API client (localStorage), ready for backend integration

import type { Prescription, Medicine } from '../types';
import { visitService } from './visitService';

export const prescriptionService = {
  /**
   * Save prescription to a visit
   * Uses PATCH /api/v1/visits/:visitId/prescription
   */
  async saveToVisit(visitId: string, prescription: Prescription): Promise<boolean> {
    const result = await visitService.updatePrescription(visitId, prescription);
    return result !== null;
  },

  /**
   * Get prescription from a visit
   * Uses GET /api/v1/visits/:visitId
   */
  async getFromVisit(visitId: string): Promise<Prescription | null> {
    const visit = await visitService.getById(visitId);
    return visit?.prescription || null;
  },

  /**
   * Create a new medicine entry (client-side helper)
   */
  createMedicine(medicineData: Omit<Medicine, 'id'>): Medicine {
    return {
      ...medicineData,
      id: `medicine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  },

  /**
   * Validate prescription data
   */
  validate(prescription: Prescription): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prescription.medicines || prescription.medicines.length === 0) {
      errors.push('At least one medicine is required');
    }

    prescription.medicines?.forEach((medicine, index) => {
      if (!medicine.name || medicine.name.trim() === '') {
        errors.push(`Medicine ${index + 1}: Name is required`);
      }
      if (!medicine.dosage || medicine.dosage.trim() === '') {
        errors.push(`Medicine ${index + 1}: Dosage is required`);
      }
      if (!medicine.duration || medicine.duration.trim() === '') {
        errors.push(`Medicine ${index + 1}: Duration is required`);
      }
    });

    if (prescription.followUp) {
      if (!prescription.followUp.value || prescription.followUp.value <= 0) {
        errors.push('Follow-up value must be greater than 0');
      }
      if (!prescription.followUp.unit) {
        errors.push('Follow-up unit is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
