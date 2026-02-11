/**
 * Utility functions for handling API validation errors
 */

import type { ApiError } from '../api/client';

/**
 * Maps API field names to form field names
 */
const FIELD_NAME_MAP: Record<string, string> = {
  // Appointment fields
  appointment_date_time: 'appointmentDateTime',
  doctor_id: 'doctor',

  // Patient fields
  mobile_number: 'mobile',
  name: 'name',
  age: 'age',
  gender: 'gender',
  date_of_birth: 'dateOfBirth',
  email: 'email',
  address: 'address',
  blood_group: 'bloodGroup',

  // Visit fields
  patient_id: 'patient',
  visit_id: 'visit',
  visit_reason: 'visitReason',
  visit_status: 'visitStatus',
  visit_date: 'visitDate',

  // Prescription fields
  prescription_id: 'prescription',
  follow_up: 'followUp',
  follow_up_unit: 'followUpUnit',
  notes: 'notes',
  prescription_items: 'medicines',
  medicine: 'medicine', // API field name for medicine name
  dosage: 'dosage',
  duration: 'duration',

  // Common fields
  clinic_id: 'clinic',
};

/**
 * Extracts field-specific validation errors from API error response
 * @param error - API error object
 * @returns Object with form field names as keys and error messages as values
 */
export function extractValidationErrors(
  error: ApiError | Error | any,
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Check if error has details (validation errors)
  if (error?.details && typeof error.details === 'object') {
    Object.entries(error.details).forEach(([field, messages]) => {
      // Handle nested field names like "prescription.prescription_items.0.notes"
      // or "prescription_items.0.notes"
      if (field.includes('.')) {
        const parts = field.split('.');

        // Check if this is a prescription_items error (array item error)
        const prescriptionItemsIndex = parts.findIndex(
          (part) => part === 'prescription_items',
        );
        if (
          prescriptionItemsIndex !== -1 &&
          parts.length > prescriptionItemsIndex + 1
        ) {
          // Extract index and field name
          const index = parts[prescriptionItemsIndex + 1];
          const fieldName =
            parts[prescriptionItemsIndex + 2] || parts[parts.length - 1];

          // Create error key like "medicine_0_notes" for prescription items
          if (!isNaN(Number(index))) {
            const medicineFieldName = `medicine_${index}_${fieldName}`;
            const message =
              Array.isArray(messages) && messages.length > 0
                ? messages[0]
                : typeof messages === 'string'
                  ? messages
                  : '';
            if (message) {
              errors[medicineFieldName] = message;
            }
            return; // Skip default mapping for nested prescription items
          }
        }

        // For other nested fields, use the last part as the field name
        const lastPart = parts[parts.length - 1];
        const formFieldName = FIELD_NAME_MAP[lastPart] || lastPart;
        const message =
          Array.isArray(messages) && messages.length > 0
            ? messages[0]
            : typeof messages === 'string'
              ? messages
              : '';
        if (message) {
          errors[formFieldName] = message;
        }
      } else {
        // Simple field name - map API field name to form field name
        const formFieldName = FIELD_NAME_MAP[field] || field;

        // Get the first error message for this field
        if (Array.isArray(messages) && messages.length > 0) {
          errors[formFieldName] = messages[0];
        } else if (typeof messages === 'string') {
          errors[formFieldName] = messages;
        }
      }
    });
  }

  return errors;
}

/**
 * Gets a general error message from API error
 * @param error - API error object
 * @returns Error message string
 */
export function getErrorMessage(error: ApiError | Error | any): string {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An error occurred. Please try again.';
}

/**
 * Checks if error has validation details
 */
export function hasValidationErrors(error: ApiError | Error | any): boolean {
  return !!(
    error?.details &&
    typeof error.details === 'object' &&
    Object.keys(error.details).length > 0
  );
}
