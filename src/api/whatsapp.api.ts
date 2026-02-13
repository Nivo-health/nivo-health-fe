// WhatsApp service - Uses API format as per API_SPECIFICATION.md
// Currently uses mock API client, ready for backend integration

import { post } from './client';
import type { Prescription } from '../types';

export interface WhatsAppResponse {
  sent: boolean;
  timestamp: string;
}

export const whatsappService = {
  /**
   * Send visit confirmation
   * POST /api/v1/whatsapp/visit-confirmation
   */
  async sendVisitConfirmation(data: {
    patientId: string;
    visitId: string;
    mobile: string;
  }): Promise<{ success: boolean; message?: string }> {
    const response = await post<WhatsAppResponse>(
      '/whatsapp/visit-confirmation',
      data,
    );

    if (!response.success) {
      return {
        success: false,
        message: response.error?.message || 'Failed to send WhatsApp message',
      };
    }

    return {
      success: true,
      message: response.message || 'WhatsApp message sent',
    };
  },

  /**
   * Send prescription
   * POST /api/v1/whatsapp/prescription
   */
  async sendPrescription(data: {
    patientId: string;
    visitId: string;
    mobile: string;
    prescription: Prescription;
  }): Promise<{ success: boolean; message?: string }> {
    const response = await post<WhatsAppResponse>(
      '/whatsapp/prescription',
      data,
    );

    if (!response.success) {
      return {
        success: false,
        message: response.error?.message || 'Failed to send prescription',
      };
    }

    return {
      success: true,
      message: response.message || 'Prescription sent on WhatsApp',
    };
  },
};
