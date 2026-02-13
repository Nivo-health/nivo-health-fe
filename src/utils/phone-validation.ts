/**
 * Validates an Indian mobile number (10 digits starting with 6-9)
 * Accepts formats: 9876543210, +91 9876543210, +919876543210, 91 9876543210
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  error?: string;
} {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Mobile number is required' };
  }

  // Remove spaces, hyphens, and parentheses for validation
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Strip leading +91 or 91 prefix
  let digits = cleaned;
  if (digits.startsWith('+91')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }

  // Must be exactly 10 digits starting with 6-9
  if (!/^[6-9]\d{9}$/.test(digits)) {
    if (digits.length < 10) {
      return {
        isValid: false,
        error: 'Mobile number must be 10 digits',
      };
    }
    if (digits.length > 10) {
      return {
        isValid: false,
        error: 'Mobile number is too long (must be 10 digits)',
      };
    }
    return {
      isValid: false,
      error: 'Please enter a valid Indian mobile number (starting with 6-9)',
    };
  }

  return { isValid: true };
}

/**
 * Formats phone input to allow only valid characters
 * Allows: digits, +, spaces, hyphens, parentheses
 */
export function formatPhoneInput(value: string): string {
  return value.replace(/[^\d+\s\-()]/g, '');
}

/**
 * Extracts the 10-digit Indian mobile number and returns it with +91 prefix
 * for sending to the backend.
 */
export function formatPhoneForAPI(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');

  let digits = cleaned;
  if (digits.startsWith('+91')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }

  // when sending number with +91 it's not returning patients
  return `+91${digits}`;
}
