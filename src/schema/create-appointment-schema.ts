import { validatePhoneNumber } from '@/utils/phone-validation';
import { z } from 'zod';

export const createAppointmentSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  mobile: z.string().refine(
    (val) => {
      const validation = validatePhoneNumber(val);
      return validation.isValid;
    },
    {
      message: 'Please enter a valid mobile number',
    },
  ),
  gender: z.enum(['M', 'F'], {
    message: 'Gender is required',
  }),
  doctorId: z.string().optional(),
  appointmentDateTime: z
    .string()
    .min(1, 'Appointment date and time is required'),
});
