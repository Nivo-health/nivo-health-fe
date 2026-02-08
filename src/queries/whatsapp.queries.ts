import { useMutation } from '@tanstack/react-query';
import { whatsappService } from '../api/whatsapp.api';

export function useSendVisitConfirmation() {
  return useMutation({
    mutationKey: ['whatsapp', 'visitConfirmation'],
    mutationFn: whatsappService.sendVisitConfirmation,
  });
}

export function useSendPrescription() {
  return useMutation({
    mutationKey: ['whatsapp', 'prescription'],
    mutationFn: whatsappService.sendPrescription,
  });
}
