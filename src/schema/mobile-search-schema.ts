import { validatePhoneNumber } from '@/utils/phone-validation';
import { z } from 'zod';

export const mobileSearchSchema = z.object({
  mobile: z.string().superRefine((val, ctx) => {
    const validation = validatePhoneNumber(val);
    if (!validation.isValid) {
      ctx.addIssue({
        code: 'custom',
        message: validation.error || 'Please enter a valid mobile number',
      });
    }
  }),
});
