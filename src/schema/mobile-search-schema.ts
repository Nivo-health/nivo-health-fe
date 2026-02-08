import { validatePhoneNumber } from '@/utils/phoneValidation';
import { z } from 'zod';

export const mobileSearchSchema = z.object({
  mobile: z.string().refine(
    (val) => {
      const validation = validatePhoneNumber(val);
      return validation.isValid;
    },
    {
      message: 'Please enter a valid mobile number',
    },
  ),
});
