import { validatePhoneNumber } from '@/utils/phone-validation';
import { z } from 'zod';

export const bookSlotSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  mobile: z.string().superRefine((val, ctx) => {
    const validation = validatePhoneNumber(val);
    if (!validation.isValid) {
      ctx.addIssue({
        code: 'custom',
        message: validation.error || 'Please enter a valid mobile number',
      });
    }
  }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Gender is required',
  }),
  source: z
    .enum(['PHONE', 'WHATSAPP', 'WALK_IN', 'WEBSITE', 'OTHER'])
    .optional(),
});
