import { isValidPhoneNumber } from 'react-phone-number-input';

export { isValidPhoneNumber };

/**
 * Validates a phone number held in E.164 form (the shape <PhoneField> emits).
 * Returns an Omrive-style error message, or null when the value is valid — or
 * empty and not required (the contact fields are optional).
 */
export function phoneError(value, { required = false } = {}) {
  const trimmed = (value || '').trim();
  if (!trimmed) return required ? 'Phone number is required' : null;
  if (!isValidPhoneNumber(trimmed)) {
    return 'Enter a valid phone number for the selected country';
  }
  return null;
}
