import { validatePhoneNumber } from '@/utils/phone-validation';
import { z } from 'zod';

export const bookSlotSchema = z.object({
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
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Gender is required',
  }),
  source: z
    .enum(['PHONE', 'WHATSAPP', 'WALK_IN', 'WEBSITE', 'OTHER'])
    .optional(),
});
