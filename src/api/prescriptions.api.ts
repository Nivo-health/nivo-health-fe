// Prescription service - Uses API format
// POST /api/visits/:visitId/prescription (create)
// PUT /api/visits/prescription/:prescriptionId (update)
// GET /api/visits/prescription/:prescriptionId (get)

import { get, post, put } from './client';
import { ApiError } from '@/lib/query-client';
import type { Prescription, Medicine, FollowUp } from '../types';
import { visitService } from './visits.api';
import dayjs from 'dayjs';

export const prescriptionService = {
  /**
   * Map API prescription format to frontend format
   */
  mapApiPrescriptionToPrescription(apiPrescription: any): Prescription {
    const medicines: Medicine[] = (
      apiPrescription.prescription_items || []
    ).map((item: any) => ({
      id:
        item.id ||
        `medicine_${dayjs().valueOf()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.medicine || '',
      dosage: item.dosage || '',
      duration: item.duration || '',
      notes: item.notes || undefined,
    }));

    let followUp: FollowUp | undefined = undefined;
    if (apiPrescription.follow_up && apiPrescription.follow_up_unit) {
      const unitMap: Record<string, 'days' | 'weeks' | 'months'> = {
        DAYS: 'days',
        WEEKS: 'weeks',
        MONTHS: 'months',
      };
      followUp = {
        value: apiPrescription.follow_up,
        unit: unitMap[apiPrescription.follow_up_unit] || 'days',
      };
    }

    return {
      medicines,
      followUp,
      notes: apiPrescription.notes || undefined,
    };
  },

  /**
   * Map frontend prescription format to API format
   */
  mapPrescriptionToApi(prescription: Prescription): any {
    const unitMap: Record<
      'days' | 'weeks' | 'months',
      'DAYS' | 'WEEKS' | 'MONTHS'
    > = {
      days: 'DAYS',
      weeks: 'WEEKS',
      months: 'MONTHS',
    };

    return {
      follow_up: prescription.followUp?.value || null,
      follow_up_unit: prescription.followUp
        ? unitMap[prescription.followUp.unit]
        : null,
      notes: prescription.notes ?? '',
      prescription_items: prescription.medicines
        .filter((med) => med.name.trim() !== '')
        .map((med) => ({
          medicine: med.name,
          dosage: med.dosage,
          duration: med.duration,
          notes: med.notes && med.notes.trim() !== '' ? med.notes.trim() : '', // Ensure notes is always a string, not null
        })),
    };
  },

  /**
   * Get prescription by ID
   * GET /api/visits/prescription/:prescriptionId
   */
  async getById(prescriptionId: string): Promise<Prescription | null> {
    try {
      const response = await get<any>(`/visits/prescription/${prescriptionId}`);

      if (!response.success || !response.data) {
        return null;
      }

      return this.mapApiPrescriptionToPrescription(response.data);
    } catch (error: any) {
      return null;
    }
  },

  /**
   * Create prescription for a visit
   * POST /api/visits/:visitId/prescription
   */
  async create(
    visitId: string,
    prescription: Prescription,
  ): Promise<string | null> {
    try {
      const apiData = this.mapPrescriptionToApi(prescription);

      const response = await post<any>(
        `/visits/${visitId}/prescription`,
        apiData,
      );

      if (!response.success || !response.data) {
        throw new ApiError(
          response.error?.message || 'Failed to create prescription',
          response.error?.code || 'PRESCRIPTION_CREATE_ERROR',
          response.error?.statusCode,
          response.error?.details,
        );
      }

      return response.data.id; // Return prescription ID
    } catch (error: any) {
      throw error; // Re-throw to allow error handling in UI
    }
  },

  /**
   * Update prescription
   * PUT /api/visits/prescription/:prescriptionId
   */
  async update(
    prescriptionId: string,
    prescription: Prescription,
  ): Promise<boolean> {
    try {
      const apiData = this.mapPrescriptionToApi(prescription);

      const response = await put<any>(
        `/visits/prescription/${prescriptionId}`,
        apiData,
      );

      if (!response.success) {
        throw new ApiError(
          response.error?.message || 'Failed to update prescription',
          response.error?.code || 'PRESCRIPTION_UPDATE_ERROR',
          response.error?.statusCode,
          response.error?.details,
        );
      }

      return true;
    } catch (error: any) {
      throw error; // Re-throw to allow error handling in UI
    }
  },

  /**
   * Save prescription to a visit (creates or updates based on prescription_id)
   * This is the main method used by PrescriptionScreen
   */
  async saveToVisit(
    visitId: string,
    prescription: Prescription,
  ): Promise<boolean> {
    try {
      // Get the visit to check if prescription_id exists
      const visit = await visitService.getById(visitId);
      if (!visit) {
        return false;
      }

      // If prescription_id exists, update; otherwise create
      if (visit.prescription_id) {
        return await this.update(visit.prescription_id, prescription);
      } else {
        const prescriptionId = await this.create(visitId, prescription);
        if (prescriptionId) {
          // Reload visit to get updated prescription_id
          const updatedVisit = await visitService.getById(visitId);
          if (updatedVisit) {
            // The visit will have the prescription_id now
            return true;
          }
        }
        return false;
      }
    } catch (error: any) {
      return false;
    }
  },

  /**
   * Get prescription from a visit
   * First checks if visit has prescription_id, then fetches the prescription
   */
  async getFromVisit(visitId: string): Promise<Prescription | null> {
    try {
      const visit = await visitService.getById(visitId);
      if (!visit || !visit.prescription_id) {
        return null;
      }

      return await this.getById(visit.prescription_id);
    } catch (error: any) {
      return null;
    }
  },

  /**
   * Create a new medicine entry (client-side helper)
   */
  createMedicine(medicineData: Omit<Medicine, 'id'>): Medicine {
    return {
      ...medicineData,
      id: `medicine_${dayjs().valueOf()}_${Math.random().toString(36).substr(2, 9)}`,
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
