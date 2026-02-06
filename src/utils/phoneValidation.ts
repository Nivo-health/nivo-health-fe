/**
 * Validates a phone/mobile number allowing country codes
 * Supports formats like: +91 9876543210, +1-555-123-4567, 9876543210, etc.
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

  // Count digits for validation
  const digitCount = cleaned.replace(/\D/g, '').length;

  // Validate format: must start with + (for country code) or digit 1-9, and have 7-15 digits total
  let isValid = false;

  if (cleaned.startsWith('+')) {
    // Country code format: + followed by 1-15 digits (total including country code)
    // First digit after + should be 1-9
    isValid =
      /^\+[1-9]\d{6,14}$/.test(cleaned) && digitCount >= 7 && digitCount <= 15;
  } else {
    // Local format: starts with 1-9, followed by 6-14 more digits (total 7-15 digits)
    isValid =
      /^[1-9]\d{6,14}$/.test(cleaned) && digitCount >= 7 && digitCount <= 15;
  }

  if (!isValid) {
    if (cleaned.startsWith('+') && digitCount < 7) {
      return {
        isValid: false,
        error: 'Phone number with country code must have at least 7 digits',
      };
    } else if (!cleaned.startsWith('+') && digitCount < 7) {
      return {
        isValid: false,
        error: 'Phone number must have at least 7 digits',
      };
    } else if (digitCount > 15) {
      return {
        isValid: false,
        error: 'Phone number is too long (maximum 15 digits)',
      };
    } else if (cleaned.startsWith('+') && !/^\+[1-9]/.test(cleaned)) {
      return {
        isValid: false,
        error: 'Country code must start with a digit 1-9',
      };
    } else {
      return { isValid: false, error: 'Please enter a valid phone number' };
    }
  }

  return { isValid: true };
}

/**
 * Formats phone input to allow only valid characters
 * Allows: digits, +, spaces, hyphens, parentheses
 */
export function formatPhoneInput(value: string): string {
  // Allow digits, +, spaces, hyphens, and parentheses
  return value.replace(/[^\d+\s\-()]/g, '');
}
